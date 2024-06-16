import express from 'express';
import { createSubscription, fetchAllSubscription, fetchAllSubscriptionByAdmin } from '../controllers/subscriptionController.js';

const router = express.Router();


// Create a donation

router.post('/create-subscription', createSubscription);

router.post('/fetch-all-subscription-by-admin', fetchAllSubscriptionByAdmin);

router.get('/fetch-all-subscription', fetchAllSubscription);


export default router;
