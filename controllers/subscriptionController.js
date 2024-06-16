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
dotenv.config();
var instance = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })


export const createSubscription = async (req, res) => {
    let { donateUser, temple, amount, currency } = req.body;
    if (currency == "INR") {
        amount = amount * 100;
    }

    let user = await userModel.findOne({ email: donateUser.email });

    if (!user) {
        console.log("User not found, creating new user...");
        const password = Math.random().toString(36).slice(-8);
        const hashedPassword = await hashPassword(password);
        user = new userModel({
            name: donateUser.name, email: donateUser.email, phone: donateUser.phone, password: hashedPassword,
        });
        await user.save();
    } else {
        console.log("User found:", user);
    }

    try {
        const plan = await instance.plans.create({
            period: 'monthly',
            interval: 1,
            "item": {
                name: donateUser.name + ' ' + amount + ' ' + currency + ' ' + new Date().getTime(),
                amount: amount,
                currency: currency,
                "description": "Monthly subscription plan for user " + donateUser.name + " with amount " + amount + " and currency " + currency + " at " + new Date().getTime(),
            }
        });


        const subscription = await instance.subscriptions.create({
            plan_id: plan.id,
            total_count: 30,
            customer_notify: 1,
        });

        const newSubscription = new Subscription({
            amount: amount / 100,
            status: 'active',
            currency: currency,
            donateUser: JSON.stringify(donateUser),
            temple: temple,
            subscription_id: subscription.id,
            plan_id: plan.id,
        });
        await newSubscription.save();

        res.json({ success: true, subscription, message: 'Subscription created successfully', newSubscription });

    } catch (error) {
        console.log("Error creating plan or subscription:", error);
        res.status(500).json({ success: false, message: 'Failed to create plan' });
    }
}


export const fetchAllSubscriptionByAdmin = async (req, res) => {
    try {

        const { id } = req.body;

        const user = await userModel.findById(id);
        const temples = await Temple.find({ createdBy: id });
        const subscriptions = await Subscription.find({ temple: { $in: temples } }).sort({ date: -1 });
        res.status(200).json({ success: true, subscriptions });

    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: 'Failed to fetch subscription' });
    }
}


export const fetchAllSubscription = async (req, res) => {
    try {

        const subscriptions = await Subscription.find().sort({ date: -1 });
        res.status(200).json({ success: true, subscriptions });

    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: 'Failed to fetch subscription' });
    }
}

