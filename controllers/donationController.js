import Donation from '../models/donationModel.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
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


export const allDonationsByUser = async (req, res) => {
    try {
      const { id } = req.body;
      let count = 100; // Number of donations to fetch per request
      let skip = 0;
      let donations = [];
  
      // Fetch donations in a loop to handle pagination
      while (true) {
        const options = {
          count: count,
          skip: skip,
        };
  
        // Fetch donations
        const donationResponse = await instance.payments.all(options);
        donations = donations.concat(donationResponse.items);
  
        // If the number of fetched donations is less than count, exit the loop
        if (donationResponse.items.length < count) {
          break;
        }
  
        // Increment skip to fetch the next batch of donations
        skip += count;
      }
  
      // Filter donations by user ID
      const userDonations = donations.filter(donation => donation.notes && donation.notes.donateUser === id);
  
      res.status(200).json({ success: true, message: 'Donations retrieved successfully', donations: userDonations });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };


export const request80Certificate = async (req, res) => {
    try {
        const { id } = req.body;

        // Fetch all payments
        const donation = await instance.payments.fetch(id);
        const fetchDonation = Donation.findByIdAndUpdate(id, { is80CertificateRequested: true }, { new: true });
        if (!fetchDonation) {
           new Donation({ is80CertificateRequested: true,razorpay_order_id:donation.order_id,razorpay_payment_id:donation.id,razorpay_signature:donation.signature}).save()
        }
        res.status(200).json({ success: true, message: '80G certificate requested successfully' ,donation});
    } catch (error) {
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
              "item":{
                name : userId + ' ' + amount + ' ' + currency + ' ' + new Date().getTime(),
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





