import mongoose from "mongoose";


const eventModel = mongoose.Schema({
    templeId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Temple',
        required: true
    },
    eventName: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    date: {
        start: {
            type: Date,
            required: true
        },
        end: {
            type: Date,
            required: true
        }
    },
    timing: {
        start: {
            type: String,
            required: true
        },
        end: {
            type: String,
            required: true
        }
    },
    images: { type: [String], required: false } 
});

export default mongoose.model('Event', eventModel);