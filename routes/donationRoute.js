import express from 'express';
import {
    checkout,
    paymentVerification,

    fetchAllDonations,
    request80Certificate,
    allDonationsByUser,
    allDonationsByAdmin,
    upload80Certificate,
    update80Certificate,
    donationInLast30Days,
    allDonationsExistingPaymentMethod
} from '../controllers/donationController.js';
import { isSignin } from '../middlewares/authMiddleware.js';
import pdfUpload from '../config/pdfMulter.js';

const router = express.Router();


// Create a donation
router.post('/checkout', checkout);

router.post('/payment-verification', paymentVerification);

router.post('/fetch-all-donation', fetchAllDonations);

router.post('/request-80-certificate', request80Certificate);

router.post('/fetch-donations-by-user', allDonationsByUser);

router.post('/fetch-donations-by-admin', allDonationsByAdmin);

router.post('/upload-80-certificate', upload80Certificate);

router.put('/update-80-certificate', update80Certificate);

router.get('/fetch-donation-last-30-days', donationInLast30Days);

router.get('/fetch-payment-methods', allDonationsExistingPaymentMethod)


export default router;
