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
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: true
    },
    images: {
        logo: { type: String, required: false }, // store file paths or URLs
        bannerImage: { type: String, required: false }, // store file paths or URLs
        otherImages: { type: [String], required: false } // store file paths or URLs
    },

    })

export default mongoose.model('Event', eventModel);