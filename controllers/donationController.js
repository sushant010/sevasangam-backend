import Donation from '../models/donationModel.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import Payment from '../models/payment.js';
import userModel from '../models/userModel.js';
import Temple from '../models/templeModel.js';

var instance = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })


export const checkout = async (req, res) => {

    const { amount } = req.body;
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
        if (!donation) {
            return res.status(404).json({ success: false, message: 'Donation not found' });
        }

        res.redirect('http://localhost:5173/temples');

    } else {
        res.status(400).json({
            success: false,
        });
    }
}


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

        console.log(req.body)

        // Base options for fetching donations
        const options = {
            count,
            skip,
        };

        // Fetch all payments
        const allDonations = await instance.payments.all(options);

        let templeCreatorMap = {};
        if (templeCreatedBy) {
            // Get unique temple IDs from donations
            const templeIds = [...new Set(allDonations.items.map(donation => donation.notes.temple))];
            // Fetch temples created by the specified user
            const temples = await Temple.find({ _id: { $in: templeIds }, createdBy: templeCreatedBy });
            // Map temple IDs to their creators
            templeCreatorMap = temples.reduce((map, temple) => {
                map[temple._id] = temple.createdBy.toString();
                return map;
            }, {});
        }

        // Filter donations based on parameters
        const filteredDonations = allDonations.items.filter(donation => {
            let isValid = true;

            if (temple && donation.notes.temple !== temple) {
                isValid = false;
            }

            if (payId && donation.id !== payId) {
                isValid = false;
            }

            if (templeCreatedBy && templeCreatorMap[donation.notes.temple] !== templeCreatedBy) {
                isValid = false;
            }

            if (donateUser && donation.notes.donateUser) {
                const donateUserParsed = JSON.parse(donation.notes.donateUser);
                if (donateUserParsed.name !== donateUser && donateUserParsed.email !== donateUser && donateUserParsed.phone !== donateUser) {
                    isValid = false;
                }
            }

            if (paymentMethod && donation.method !== paymentMethod) {
                isValid = false;
            }

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

        res.status(200).send({
            success: true,
            message: 'Fetched Donations!',
            donations: {
                items: filteredDonations
            }
        });
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).send({ success: false, message: 'Error fetching payments' });
    }
};







export const subscription = async (req, res) => {
    try {
        const subscription = await instance.subscriptions.create({
            plan_id: req.body.plan_id,
            total_count: req.body.total_count,
            customer_notify: req.body.customer_notify,
            amount: req.body.amount,
            start_at: req.body.start_at
        });
        res.json({ success: true, subscription });
    } catch (error) {
        console.error('Error creating subscription:', error);
        res.status(500).json({ success: false, message: 'Failed to create subscription' });
    }
}




// Create a donation
export const createDonation = async (req, res) => {
    try {
        const { amount, user, temple, paymentMethod, transactionId } = req.body;

        const newDonation = new Donation({
            amount,
            user,
            temple,
            paymentMethod,
            transactionId,
            status: 'pending', // Default status
        });

        const savedDonation = await newDonation.save();
        res.status(201).json({ success: true, data: savedDonation });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all donations
export const getDonations = async (req, res) => {
    try {
        const donations = await Donation.find().populate('user', 'name email').populate('temple', 'name location');
        res.status(200).json({ success: true, data: donations });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get a donation by ID
export const getDonationById = async (req, res) => {
    try {
        const { id } = req.params;
        const donation = await Donation.findById(id).populate('user', 'name email').populate('temple', 'name location');

        if (!donation) {
            return res.status(404).json({ success: false, message: 'Donation not found' });
        }

        res.status(200).json({ success: true, data: donation });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update a donation
export const updateDonation = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, user, temple, paymentMethod, status } = req.body;

        const updatedDonation = await Donation.findByIdAndUpdate(
            id,
            { amount, user, temple, paymentMethod, status },
            { new: true }
        );

        if (!updatedDonation) {
            return res.status(404).json({ success: false, message: 'Donation not found' });
        }

        res.status(200).json({ success: true, data: updatedDonation });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete a donation
export const deleteDonation = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedDonation = await Donation.findByIdAndDelete(id);

        if (!deletedDonation) {
            return res.status(404).json({ success: false, message: 'Donation not found' });
        }

        res.status(200).json({ success: true, message: 'Donation deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
