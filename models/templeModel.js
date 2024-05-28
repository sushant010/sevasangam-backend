import mongoose from "mongoose";
const { Schema } = mongoose;
const templeSchema = new Schema({
    templeName: {
        type: String,
        required: true
    },
    typeOfOrganization: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    donation: {
        type: Number,
        default: 0,
        required: true
    },
    contactPerson: {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        mobile: {
            type: String,
            required: true
        }

    },
    createdOn: {
        type: Date,
        default: Date.now,
    },
    location: {
        address: {
            type: String,
            required: false
        },
        country: {
            type: String,
            required: false
        }
    },
    images: {
        logo: { type: String, required: false }, // store file paths or URLs
        bannerImage: { type: String, required: false }, // store file paths or URLs
        otherImages: { type: [String], required: false } // store file paths or URLs
    },
    bankDetails: {
        bankName: { type: String, required: true },
        branch: { type: String, required: true },
        accountHolderName: { type: String, required: true },
        accountNumber: { type: String, required: true },
        ifscCode: { type: String, required: true },
        routingNumber: { type: String, required: true },
        swiftBicCode: { type: String, required: true }
    },
    taxInformation: {
        taxId: { type: String, required: true },
        ein: { type: String, required: true }
    },
    website: {
        type: String,
        required: false
    },
    isVerified: {
        type: Number,
        default: 0
    },
    isCreated: {
        type: Number,
        default: 1
    },
    socialMedia: {
        facebook: { type: String, required: false },
        twitter: { type: String, required: false },
        instagram: { type: String, required: false },
        // Add other social media links as nefalse
    },
    // upcomingEvents: [{
    //     name: { type: String, required: false },
    //     description: { type: String, required: false },
    //     timing: { type: String, required: false },
    //     images: { type: [String], required: false } // array of image paths or URLs
    // }]  // array of objects
    pendingChanges: {
        type: Object,
        default: null,
    },
});



const Temple = mongoose.model('Temple', templeSchema);
export default Temple;