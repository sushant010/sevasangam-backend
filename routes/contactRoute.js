import { createContactTicket, getAllContactTickets, updateContactTicketStatus } from "../controllers/contactTicketController.js";
import express from 'express';

const router = express.Router();



router.post('/create-contact-form', createContactTicket);

router.post('/get-all-contact-tickets', getAllContactTickets)

router.put('/update-contact-ticket-status', updateContactTicketStatus);


export default router;

