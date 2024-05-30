import express from 'express';
import {
    checkout,
    paymentVerification,
    subscription,
    fetchAllDonations,
    request80Certificate,
    allDonationsByUser
} from '../controllers/donationController.js';
import { isSignin } from '../middlewares/authMiddleware.js';

const router = express.Router();


// Create a donation
router.post('/checkout', checkout);

router.post('/payment-verification', paymentVerification);

router.post('/fetch-all-donation', fetchAllDonations);

router.post('/request-80-certificate', request80Certificate);

router.post('/fetch-donations-by-user', allDonationsByUser);




router.post('/subscription', subscription);





export default router;
