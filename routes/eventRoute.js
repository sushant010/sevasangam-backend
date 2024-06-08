
import express from 'express';
import { UpdateEvent, createEvent, deleteEvent, fetchEvent, getAllEvents, getAllEventsByTemple } from '../controllers/eventController.js';

const router = express.Router();



router.post('/create-event', createEvent);

router.get('/fetch-event/:id', fetchEvent);

router.post('/get-all-events-by-temple/:id', getAllEventsByTemple)

router.put('/update-event/:id', UpdateEvent)

router.delete('/delete-event/:id', deleteEvent)

router.get('/get-all-events', getAllEvents)


export default router;

