import eventModel from '../models/eventModel.js';
import Temple from '../models/templeModel.js';

export const createEvent = async (req, res) => {

    try {
        const { name, description, date, timing, templeId } = req.body;
        console.log(templeId)

        const temple = await Temple.findById(templeId);

        if (!temple) {
            return res.status(404).json({ message: 'Temple not found' });
        }

        const event = {
            name,
            description,
            date,
            timing,
            temple: templeId
        }

        const newEvent = await eventModel.create(event);

        // const temple =  await templeModel.findByIdAndUpdate(templeId, { $push: { events: newEvent._id } }, { new: true });


        res.status(201).send({ success: true, message: 'Event created successfully', data: newEvent });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error' });
    }


}

export const fetchEvent = async (req, res) => {
    try {
        const { id } = req.params;

        const event = await eventModel.findById(id).populate('temple');

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.status(200).send({ success: true, message: 'Event fetched successfully', event });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error' });
    }

}

export const UpdateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, date, timing, images } = req.body;

        const event = await eventModel.findByIdAndUpdate(id, { name, description, date, timing, images }, { new: true });

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.status(200).send({ success: true, message: 'Event updated successfully', data: event });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error' });
    }


}

export const deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;

        const event = await eventModel.findByIdAndDelete(id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.status(200).send({ success: true, message: 'Event deleted successfully', data: event });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error' });
    }


}

export const getAllEventsByTemple = async (req, res) => {

    try {
        const { id } = req.params;

        console.log(id)

        const events = await eventModel.find({ temple: id }).populate('temple');

        if (!events) {
            return res.status(404).json({ message: 'Events not found' });
        }

        res.status(200).send({ success: true, message: 'Event fetched successfully', data: events });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error' });
    }



}


export const getAllEvents = async (req, res) => {
    try {
        const events = await eventModel.find()

        if (!events) {
            return res.status(404).json({ message: 'Events not found' });
        }

        res.status(201).send({ success: true, message: 'Event fetched successfully', data: events });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}