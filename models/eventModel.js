import mongoose from "mongoose";


const eventModel = mongoose.Schema({
    temple: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Temple',
        required: true
    },
    name: {
        type: String,
        required: true,

    },
    description: {
        type: String,
        required: true,

    },
    date: {
        start: {
            type: Date,
            required: true,
            default: Date.now

        },
        end: {
            type: Date,
            required: true,
            default: Date.now + 2
        }
    },
    timing: {
        start: {
            type: String,
            required: true,
            default: '08:00 AM'
        },
        end: {
            type: String,
            required: true,
            default: '08:00 PM'
        }
    },
    images: { type: [String], required: false }
});

export default mongoose.model('Event', eventModel);