import { createContactTicket, getAllContactTickets } from "../controllers/contactTicketController.js";
import express from 'express';

const router = express.Router();



router.post('/create-contact-form', createContactTicket);

router.get('/get-all-contact-tickets', getAllContactTickets)


export default router;

