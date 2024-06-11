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
dotenv.config();
var instance = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })


export const checkout = async (req, res) => {

    const { amount, donateUser } = req.body;
    const { name, email, phone } = donateUser;
    console.log(req.body)

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


        const donation = new Donation(
            {
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature
            }
        );
        donation.save();


        // Fetch all payments from Razorpay
        const razorPayDonation = await instance.payments.fetch(razorpay_payment_id);

        const temple = await Temple.findById(razorPayDonation.notes.temple);

        temple.donation += razorPayDonation.notes.amount;
        await temple.save();

        if (!donation) {
            return res.status(404).json({ success: false, message: 'Donation not found' });
        }


        res.redirect(`${process.env.WEBSITE_URL}/temples`);

    } else {
        res.status(400).json({
            success: false,
        });
    }
}

// export const fetchAllDonations = async (req, res) => {
//     try {
//         const {
//             count = 10,
//             skip = 0,
//             temple,
//             payId,
//             templeCreatedBy,
//             donateUser,
//             paymentMethod,
//             dateFrom,
//             dateTo
//         } = req.body;

//         // Base options for fetching donations
//         const options = {
//             count,
//             skip,
//         };

//         // Fetch all payments
//         const fetchAllDonations = await instance.payments.all(options);

//         let templeCreatorMap = {};
//         if (templeCreatedBy) {
//             // Get unique temple IDs from donations
//             const templeIds = [...new Set(fetchAllDonations.items.map(donation => donation.notes.temple))];
//             // Fetch temples created by the specified user
//             const temples = await Temple.find({ _id: { $in: templeIds }, createdBy: templeCreatedBy });
//             // Map temple IDs to their creators
//             templeCreatorMap = temples.reduce((map, temple) => {
//                 map[temple._id] = temple.createdBy.toString();
//                 return map;
//             }, {});
//         }

//         // Filter donations based on parameters
//         const filteredDonations = fetchAllDonations.items.filter(donation => {
//             let isValid = true;

//             if (temple && donation.notes.temple !== temple) {
//                 isValid = false;
//             }

//             if (payId && donation.id !== payId) {
//                 isValid = false;
//             }

//             if (templeCreatedBy && templeCreatorMap[donation.notes.temple] !== templeCreatedBy) {
//                 isValid = false;
//             }

//             if (donateUser && donation.notes.donateUser) {
//                 const donateUserParsed = JSON.parse(donation.notes.donateUser);
//                 if (donateUserParsed.name !== donateUser && donateUserParsed.email !== donateUser && donateUserParsed.phone !== donateUser) {
//                     isValid = false;
//                 }
//             }

//             if (paymentMethod && donation.method !== paymentMethod) {
//                 isValid = false;
//             }

//             if (dateFrom) {
//                 const donationDate = new Date(donation.created_at * 1000);
//                 const fromDate = new Date(dateFrom);
//                 if (donationDate < fromDate) {
//                     isValid = false;
//                 }
//             }

//             if (dateTo) {
//                 const donationDate = new Date(donation.created_at * 1000);
//                 const toDate = new Date(dateTo);
//                 if (donationDate > toDate) {
//                     isValid = false;
//                 }
//             }

//             return isValid;
//         });

//         const allDonations = await Donation.find({});
//         let customDonations = [];

//         for (let donation of filteredDonations) {
//             let customDonation = allDonations.find(d => d.razorpay_payment_id === donation.id);
//             if (customDonation) {
//                 customDonations.push(customDonation);
//             } else {

//                 let user = userModel.findOne({ email: JSON.parse(donation.notes.donateUser).email });
//                 if (!user) {
//                     const password = Math.random().toString(36).slice(-8);
//                     const hashedPassword = await hashPassword(password);
//                     user = new userModel({
//                         name: JSON.parse(donation.notes.donateUser).name,
//                         email: JSON.parse(donation.notes.donateUser).email,
//                         phone: JSON.parse(donation.notes.donateUser).phone,
//                         password: hashedPassword,
//                     })
//                     await user.save();
//                 }

//                 customDonation = new Donation({
//                     amount: donation.amount,
//                     date: donation.created_at,
//                     donateUser: donation.notes.donateUser,
//                     temple: donation.notes.temple,
//                     razorpay_order_id: donation.order_id,
//                     razorpay_payment_id: donation.id,
//                     razorpay_signature: donation.signature
//                 });
//                 await customDonation.save();
//                 customDonations.push(customDonation);
//             }
//         }

//         res.status(200).json({ success: true, message: 'Donations retrieved successfully', razorpayDonations: filteredDonations, donations: customDonations });
//     } catch (error) {
//         console.error('Error fetching payments:', error);
//         res.status(500).send({ success: false, message: 'Error fetching payments' });
//     }
// };



export const fetchAllDonations = async (req, res) => {
    try {
        const {
            count = 10,
            skip = 0,
            temple,
            payId,
            templeCreatedBy,
            donateUser,
            paymentMethod,
            dateFrom,
            dateTo
        } = req.body;

        // Base options for fetching donations
        const options = {
            count,
            skip,
        };

        // Fetch all payments from Razorpay
        const fetchAllDonations = await instance.payments.all(options);

        let templeCreatorMap = {};

        const filteredTemples = await Temple.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "createdBy",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $match: {
                    "user.name": {
                        $regex: templeCreatedBy ? templeCreatedBy : '',
                        $options: 'i'

                    },
                    "templeName": {
                        $regex: temple ? temple : '',
                        $options: 'i'
                    }

                }
            }
        ])



        const filteredDonations = fetchAllDonations.items.filter(donation => {
            let isValid = true;

            const filterTempleIds = filteredTemples.map((val) => val._id.toString())


            if (!filterTempleIds.includes(donation.notes?.temple)) {
                isValid = false;
            }


            if (payId && donation.id !== payId) {
                isValid = false;
            }


            if (donateUser && donation.notes?.donateUser) {
                try {
                    const donateUserParsed = JSON.parse(donation.notes.donateUser);
                    if (donateUserParsed.name !== donateUser && donateUserParsed.email !== donateUser && donateUserParsed.phone !== donateUser) {
                        isValid = false;
                    }
                } catch (error) {
                    isValid = false;
                }
            }

            if (paymentMethod && donation.method !== paymentMethod) {
                isValid = false;
            }

            console.log(dateFrom, dateTo)

            if (dateFrom) {
                const donationDate = new Date(donation.created_at * 1000);
                const fromDate = new Date(dateFrom);
                if (donationDate < fromDate) {
                    isValid = false;
                }
            }

            if (dateTo) {
                const donationDate = new Date(donation.created_at * 1000);
                const toDate = new Date(dateTo);
                if (donationDate > toDate) {
                    isValid = false;
                }
            }

            return isValid;
        });

        const allDonations = await Donation.find({});
        const allEmails = filteredDonations.map(donation => donation.notes?.donateUser ? JSON.parse(donation.notes.donateUser).email : null).filter(email => email);
        const allUsers = await userModel.find({ email: { $in: allEmails } });

        let customDonations = [];

        for (let donation of filteredDonations) {
            let customDonation = allDonations.find(d => d.razorpay_payment_id === donation.id);
            if (customDonation) {
                customDonations.push(customDonation);
            } else if (donation.notes?.donateUser) {
                const donateUserParsed = JSON.parse(donation.notes.donateUser);
                const donateUserEmail = donateUserParsed.email;
                let user = allUsers.find(u => u.email === donateUserEmail);



                customDonation = new Donation({
                    amount: donation.amount,
                    date: donation.created_at,
                    donateUser: donation.notes.donateUser,
                    temple: donation.notes?.temple,
                    razorpay_order_id: donation.order_id,
                    razorpay_payment_id: donation.id,
                    razorpay_signature: donation.signature
                });
                await customDonation.save();
                customDonations.push(customDonation);
            }
        }

        res.status(200).json({ success: true, message: 'Donations retrieved successfully', razorpayDonations: filteredDonations, donations: customDonations });
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).send({ success: false, message: 'Error fetching payments' });
    }
};



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
        const fetchAllRazorpayAllDonations = await instance.payments.all(options);

        const razorpayAllDonations = fetchAllRazorpayAllDonations.items;

        const userDonations = razorpayAllDonations.filter(
            (donation) => {
                if (donation.notes && donation.notes.donateUser) {
                    try {
                        const donateUser = JSON.parse(donation.notes.donateUser);
                        return donateUser.email === email;
                    } catch (error) {
                        // Handle JSON parse error if donateUser is not a valid JSON string
                        res.status(200).json({ success: true, message: 'No Donations found' });
                    }
                }
                return false;
            }
        );


        const allDonations = await Donation.find({});
        let customDonations = []

        userDonations.map(donation => {
            const customDonation = allDonations.find(d => d.razorpay_payment_id === donation.id);
            if (customDonation) {
                customDonations.push(customDonation)
            }

        })

        res.status(200).json({ success: true, message: 'Donations retrieved successfully', razorpayDonations: userDonations, donations: customDonations });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};



export const allDonationsByAdmin = async (req, res) => {
    try {
        const { id } = req.body;
        let count = 100; // Number of donations to fetch per request
        let skip = 0;


        // Fetch donations in a loop to handle pagination

        const options = {
            count: count,
            skip: skip,
        };

        // Fetch donations
        const fetchAllRazorpayAllDonations = await instance.payments.all(options);

        const razorpayAllDonations = fetchAllRazorpayAllDonations.items;

        const adminDonations = razorpayAllDonations.filter(
            (donation) => {
                if (donation.notes && donation.notes.temple) {
                    try {
                        const donations = Temple.findOne({ _id: donation.notes.temple, createdBy: id });
                        return donations;
                    } catch (error) {
                        // Handle JSON parse error if donateUser is not a valid JSON string
                        res.status(200).json({ success: true, message: 'No Donations found' });
                    }
                }
                return false;
            }
        );


        const allDonations = await Donation.find({});
        let customDonations = []

        adminDonations.map(donation => {
            const customDonation = allDonations.find(d => d.razorpay_payment_id === donation.id);
            if (customDonation) {
                customDonations.push(customDonation)
            }

        })

        res.status(200).json({ success: true, message: 'Donations retrieved successfully', razorpayDonations: adminDonations, donations: customDonations });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


export const request80Certificate = async (req, res) => {
    try {
        const { id } = req.body;

        //fetch payment details

        const donationDetails = await instance.payments.fetch(id);

        const amount = donationDetails.amount / 100;
        const templeId = donationDetails.notes.temple;
        const temple = await Temple.findById(templeId);
        const templeName = temple.templeName;
        const templeAdminDetails = await Temple.findById(templeId).populate('createdBy');
        const adminEmail = templeAdminDetails.createdBy.email;
        const adminName = templeAdminDetails.createdBy.name;
        const donorDetails = JSON.parse(donationDetails.notes.donateUser)

        await send80GformRequestToAdmin(adminEmail, donorDetails.email, adminName, amount, donationDetails.created_at, templeName, templeId, donationDetails.currency,donorDetails.name, donationDetails.id);
        await send80GformRequestToSuperAdmin(process.env.WEBSITE_URL, donorDetails.name, templeId, templeName, donationDetails.id, amount, donationDetails.currency, donationDetails.created_at, temple.contactPerson.name, temple.contactPerson.email, temple.contactPerson.mobile, adminName);

        // res.status(200).json({ success: true, message: '80G certificate requested successfully' });

        // return;

        // Fetch all payments
        const donation = await instance.payments.fetch(id);
        const fetchDonation = await Donation.findOneAndUpdate({ razorpay_payment_id: id }, { is80CertificateRequested: true }, { new: true });
        if (!fetchDonation) {
            new Donation({ is80CertificateRequested: true, razorpay_order_id: donation.order_id, razorpay_payment_id: donation.id, razorpay_signature: donation.signature }).save()
        }
        res.status(200).json({ success: true, message: '80G certificate requested successfully', donation });
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message });
    }
};



export const upload80Certificate = async (req, res) => {
    try {
        const { id } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const certificatePath = req.file.path;

        // Find the donation by ID and update it with the certificate path
        const donation = await Donation.findOneAndUpdate(
            { razorpay_payment_id: id },
            { certificate: certificatePath },
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
        const { id } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const certificatePath = req.file.path;

        // Find the donation by ID and update it with the new certificate path
        const donation = await Donation.findOneAndUpdate(
            { razorpay_payment_id: id },
            { is80CertificateRequested: false },
            { certificate: certificatePath },
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
    const amount = req.body.amount;
    const userId = req.user ? req.user._id : 'no_user_id';
    const currency = req.body.currency;

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
        // console.log(plan)

        // res.json({ success: true, plan });

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





