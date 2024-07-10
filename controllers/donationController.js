import Donation from '../models/donationModel.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import userModel from '../models/userModel.js';
import Temple from '../models/templeModel.js';
import { hashPassword } from '../helpers/authHelper.js'
import { getFilteredTemples } from './templeController.js';
import dotenv from 'dotenv';
import send80GformRequestToAdmin from '../email/functions/80G-form/send80GformRequestToAdmin.js';
import send80GformRequestToSuperAdmin from "./../email/functions/80G-form/send80GfromRequestToSuperAdmin.js"
import Subscription from '../models/subscriptionModel.js';
import sendDonationAcknowledgementToDonateUser from '../email/functions/sendDonationAcknowledgementToDonateUser.js';
dotenv.config();
var instance = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })


export const checkout = async (req, res) => {

    const { amount, donateUser } = req.body;
    const { name, email, phone } = donateUser;
    // console.log(req.body)

    let user = await userModel.findOne({ email: email });

    if (!user) {
        const password = Math.random().toString(36).slice(-8);
        const hashedPassword = await hashPassword(password);
        user = new userModel({
            name, email, phone, password: hashedPassword,
        });
        await user.save();
    }

    var options = {
        amount: Number(amount * 100),
        currency: "INR",
    };

    const order = await instance.orders.create(options);
    res.status(200).json({ success: true, message: 'Payment successful', order });

}


// Call the fetchPayments function to fetch payments




export const paymentVerification = async (req, res) => {

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {

        // Fetch all payments from Razorpay
        const razorPayDonation = await instance.payments.fetch(razorpay_payment_id);
        console.log(razorPayDonation)

        const donation = new Donation(
            {
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
                amount: razorPayDonation.amount / 100,
                status: razorPayDonation.status,
                donateUser: razorPayDonation.notes.donateUser,
                temple: razorPayDonation.notes.temple,
                method: razorPayDonation.method,
                currency: razorPayDonation.currency,
                isAnonymous: razorPayDonation?.notes?.anonymous == 'false' ? false : true,
            }
        );

        await donation.save();

        const temple = await Temple.findById(razorPayDonation.notes.temple);
        temple.donation += razorPayDonation.amount / 100;
        await temple.save();
        const name = JSON.parse(razorPayDonation.notes.donateUser).name;
        const userEmail = JSON.parse(razorPayDonation.notes.donateUser).email;

        sendDonationAcknowledgementToDonateUser(userEmail, name, razorpay_payment_id, temple.templeName, razorPayDonation.amount / 100, razorPayDonation.currency, razorPayDonation.method, razorPayDonation.created_at);

        res.redirect(`${process.env.WEBSITE_URL}/temples`);

    } else {
        res.status(500).send({ success: false, message: 'Error in payment verification!' });
    }
}




export const fetchAllDonations = async (req, res) => {
    try {
        const {
            templeName,
            payId,
            templeCreatedBy,
            donateUser,
            paymentMethod,
            isAnonymous,
            dateFrom,
            dateTo,
            page = 1,
            limit = 10
        } = req.body;

        console.log('Request body:', req.body);

        // Remove empty strings from the request body
        Object.keys(req.body).forEach(key => req.body[key] === '' && delete req.body[key]);

        let query = {};

        const existingTemples = await Temple.find({}).select('_id').select('-images').select('-pendingChanges');
        const existingTempleIds = existingTemples.map(temple => temple._id);

        if (templeName) {
            const temples = await Temple.find({ templeName: { $regex: templeName, $options: 'i' } }).select('_id').exec();
            const templeIds = temples.map(temple => temple._id);
            query.temple = { $in: templeIds };
        } else {
            query.temple = { $in: existingTempleIds };
        }

        if (templeCreatedBy) {
            const temples = await Temple.find({ createdBy: templeCreatedBy }).select('_id').exec();
            const templeIds = temples.map(temple => temple._id);

            if (templeName) {

                query.temple.$in = query.temple.$in.filter(id => templeIds.includes(id));
            } else {

                query.temple = { $in: templeIds };
            }
        }

        if (payId) query.razorpay_payment_id = payId;

        if (donateUser) query['donateUser.name'] = { $regex: donateUser, $options: 'i' };
        if (paymentMethod) query.method = paymentMethod;
        if (isAnonymous) query.isAnonymous = isAnonymous;
        if (dateFrom) query.date = { $gte: new Date(dateFrom) };
        if (dateTo) {
            if (!query.date) query.created_at = {};
            query.date.$lte = new Date(dateTo);
        }



        // Calculate the skip value
        const skip = (page - 1) * limit;



        // Fetch all donations from the database
        const donations = await Donation.find({ ...query })
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit)
            .populate('temple')
            .exec();

        res.status(200).json({ success: true, message: 'Donations retrieved successfully', donations });

    } catch (error) {
        console.error('Error fetching donations:', error);
        res.status(500).send({ success: false, message: 'Error fetching donations' });
    }
};

export const allDonationsExistingPaymentMethod = async (req, res) => {

    try {

        const donations = await Donation.find({})
        const paymentMethods = Array.from(new Set(donations.map(donation => donation.method).filter(method => method)));
        res.status(200).json({ success: true, message: 'Methods retrieved successfully', paymentMethods });

    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).send({ success: false, message: 'Error fetching payments' });
    }
}

export const allDonationsByUser = async (req, res) => {
    try {
        const { email } = req.body;
        let count = 100; // Number of donations to fetch per request
        let skip = 0;


        // Fetch donations in a loop to handle pagination

        const options = {
            count: count,
            skip: skip,
        };

        // Fetch donations

        const existingTemples = await Temple.find({}).select('_id').select('-images').select('-pendingChanges');
        const existingTempleIds = existingTemples.map(temple => temple._id);
        const allDonations = await Donation.find({ temple: { $in: existingTempleIds } }).sort({ date: -1 }).populate('temple');

        const userDonations = allDonations.filter(
            (donation) => {
                if (donation?.donateUser) {
                    try {
                        const donateUser = JSON.parse(donation.donateUser);
                        return donateUser.email === email;
                    } catch (error) {
                        // Handle JSON parse error if donateUser is not a valid JSON string
                        res.status(200).json({ success: true, message: 'No Donations found' });
                    }
                }
                return false;
            }
        );

        res.status(200).json({ success: true, message: 'Donations retrieved successfully', donations: userDonations });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};



export const allDonationsByAdmin = async (req, res) => {
    try {
        const {
            templeName,
            payId,
            donateUser,
            paymentMethod,
            dateFrom,
            dateTo,
            user_id,
            page = 1,
            limit = 10
        } = req.body;

        // Remove empty strings from the request body
        Object.keys(req.body).forEach(key => {
            if (req.body[key] === '') {
                delete req.body[key];
            }
        });



        let query = {};

        // Fetch temples created by the admin
        const userTemples = await Temple.find({ createdBy: user_id }).select('_id').select('templeName').exec();
        const userTempleIds = userTemples.map(temple => temple._id);

        // Add temple filter based on admin's temples
        if (templeName) {
            const matchingTemples = await Temple.find({
                templeName: { $regex: templeName, $options: 'i' },
                createdBy: user_id
            }).select('_id').exec();
            const matchingTempleIds = matchingTemples.map(temple => temple._id);
            query.temple = { $in: matchingTempleIds };
        } else {
            // Use only the admin's temples if no specific templeName is provided
            query.temple = { $in: userTempleIds };
        }

        // Apply other filters
        if (payId) query.razorpay_payment_id = payId;
        if (donateUser) query['donateUser.name'] = { $regex: donateUser, $options: 'i' };
        if (paymentMethod) query.method = paymentMethod;
        if (dateFrom) query.date = { $gte: new Date(dateFrom) };
        if (dateTo) {
            if (!query.date) query.created_at = {};
            query.date.$lte = new Date(dateTo);
        }
        console.log(query)

        // Fetch donations based on the constructed query
        const donations = await Donation.find(query)
            .sort({ date: -1 })
            .limit(limit)
            .skip((page - 1) * limit);

        res.status(200).json({ success: true, message: 'Donations retrieved successfully', donations, temples: userTemples });
    } catch (error) {
        console.error('Error fetching donations:', error);
        res.status(500).send({ success: false, message: 'Error fetching donations' });
    }
};



export const request80Certificate = async (req, res) => {
    try {
        const { id } = req.body;

        //fetch payment details
        const donationDetails = await Donation.findById(id);

        const amount = donationDetails.amount / 100;
        const templeId = donationDetails.temple;
        const temple = await Temple.findById(templeId);
        const templeName = temple.templeName;
        const templeAdminDetails = await Temple.findById(templeId).populate('createdBy');
        const adminEmail = templeAdminDetails.createdBy.email;
        const adminName = templeAdminDetails.createdBy.name;
        const donorDetails = JSON.parse(donationDetails.donateUser)

        await send80GformRequestToAdmin(adminEmail, donorDetails.email, adminName, amount * 100, donationDetails.created_at, templeName, templeId, donationDetails.currency, donorDetails.name, donationDetails.razorpay_payment_id);
        await send80GformRequestToSuperAdmin(process.env.WEBSITE_URL, donationDetails.razorpay_payment_id, donorDetails.name, templeId, templeName, donationDetails.id, amount * 100, donationDetails.currency, donationDetails.created_at, temple.contactPerson.name, temple.contactPerson.email, temple.contactPerson.mobile, adminName);

        // res.status(200).json({ success: true, message: '80G certificate requested successfully' });

        // return;

        // Fetch all payments
        const donation = await Donation.findByIdAndUpdate(id, { is80CertificateRequested: true }, { new: true });

        res.status(200).json({ success: true, message: '80G certificate requested successfully', donation });
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message });
    }
};



export const upload80Certificate = async (req, res) => {
    try {
        const { id, certificate } = req.body;


        // Find the donation by ID and update it with the certificate path
        const donation = await Donation.findByIdAndUpdate(
            { _id: id },
            { certificate: certificate },
            { is80CertificateRequested: false },
            { new: true }
        );


        if (!donation) {
            return res.status(404).json({ success: false, message: 'Donation not found' });
        }

        res.status(200).json({ success: true, message: 'Certificate uploaded successfully', donation });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};


export const update80Certificate = async (req, res) => {
    try {
        const { id, certificate } = req.body;


        // Find the donation by ID and update it with the new certificate path
        const donation = await Donation.findOneAndUpdate(
            { _id: id },
            { is80CertificateRequested: false },
            { certificate: certificate },
            { new: true }
        );

        if (!donation) {
            return res.status(404).json({ success: false, message: 'Donation not found' });
        }

        res.status(200).json({ success: true, message: 'Certificate updated successfully', donation });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};






export const subscription = async (req, res) => {
    let amount = req.body.amount;
    const userId = req.user ? req.user._id : 'no_user_id';
    const currency = req.body.currency;

    if (currency === "INR") {
        amount = amount * 100
    }

    //create razorpay plan

    try {
        const plan = await instance.plans.create({
            period: 'monthly',
            interval: 1,
            "item": {
                name: userId + ' ' + amount + ' ' + currency + ' ' + new Date().getTime(),
                amount: amount,
                currency: currency,
                "description": "Monthly subscription plan for user " + userId + " with amount " + amount + " and currency " + currency + " at " + new Date().getTime(),

            }
        });

        //create razorpay subscription
        const subscription = await instance.subscriptions.create({
            plan_id: plan.id,
            total_count: 30,
            customer_notify: 1,
        });

        res.json({ success: true, subscription });


    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: 'Failed to create plan' });

    }

}

export const donationInLast30Days = async (req, res) => {
    try {


        const allTemples = await Temple.find({});

        let templeAndDonationAmount = {}

        allTemples.forEach(async temple => {


            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            let donationInLast30DaysAmount = 0;
            const allDonation = await Donation.find({}).populate('temple');


            const donations = allDonation && allDonation.filter(donation => donation.temple?._id.toString() === temple._id.toString());
            // console.log(allDonation)
            // console.log(`${donation.temple._id} -- ${temple._id}`)


            donations.forEach(donation => {
                if (donation?.date == undefined) {
                    return;
                }
                if (donation?.date > thirtyDaysAgo.getTime()) {
                    donationInLast30DaysAmount += donation.amount;
                }
            });

            temple.donationInLast30Days = donationInLast30DaysAmount;
            await temple.save();

        });

        res.status(200).json({
            success: true,
            message: 'Donations retrieved successfully',
            data: templeAndDonationAmount,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Failed to fetch amount' });
    }
};

