import mongoose from "mongoose";


const eventModel = mongoose.Schema({
    templeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Temple',
        required: true
    },
    eventName: {
        type: String,
        required: true,
        default: 'Event'
    },
    description: {
        type: String,
        required: true,
        default: 'Event'
    },
    date: {
        start: {
            type: Date,
            required: true,
            default: 'Event'
        },
        end: {
            type: Date,
            required: true,
            default: 'Event'
        }
    },
    timing: {
        start: {
            type: String,
            required: true,
            default: 'Event'
        },
        end: {
            type: String,
            required: true,
            default: 'Event'
        }
    },
    images: { type: [String], required: false }
});

export default mongoose.model('Event', eventModel);