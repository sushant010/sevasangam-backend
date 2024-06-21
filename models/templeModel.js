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
    aboutTemple1: {
        type: String,
        required: true,
        default: 'The Temple is a renowned religious site dedicated to a significant deity. Located in a picturesque area, it is known for its spiritual ambiance and magnificent architecture. The temple attracts numerous devotees and tourists from around the world who come to seek blessings and experience its peaceful environment. The temple complex features intricately carved pillars, majestic domes, and beautifully adorned shrines, showcasing the rich cultural heritage of the region. The sanctum houses the main idol, which is revered by worshippers, and the temple premises include various halls and smaller shrines dedicated to other deities'
    },
    aboutTemple2: {
        type: String,
        required: true,
        default: 'The history of the Temple dates back several centuries, with its origins rooted in ancient times. It was established by devout followers and has since been a significant center for religious activities. Over the centuries, the temple has undergone numerous renovations and expansions, each contributing to its grandeur and prominence. The temple has been a witness to historical events and has played a central role in the cultural and spiritual life of the community. Legends and folklore surrounding the temple speak of its divine origin and the miracles associated with the deity. Today, the temple stands as a testament to the enduring faith and devotion of its followers, continuing to be a beacon of spirituality and a symbol of the regions rich cultural legacy'
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
        state: {
            type: String,
            required: false
        },
        zipCode: {
            type: String,
            required: false
        },
        latitude: {
            type: Number,
            required: false
        },
        longitude: {
            type: Number,
            required: false
        },
        city: {
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
        routingNumber: { type: String, required: false },
        swiftBicCode: { type: String, required: false }
    },
    taxInformation: {
        taxId: { type: String, required: false },
        ein: { type: String, required: false }
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
    // Trending is defined by superadmin
    isTrending: {
        type: Number,
        default: 0
    },
    hasChangesToApprove: {
        type: Number,
        default: 0
    },
    socialMedia: {
        facebook: { type: String, required: false },
        twitter: { type: String, required: false },
        instagram: { type: String, required: false },
        // Add other social media links as nefalse
    },
    pendingChanges: {
        type: Object,
        default: null,
    },
    timing: {
        start: {
            type: String,
            required: false,
            default: '08:00'
        },
        end: {
            type: String,
            required: false,
            default: '17:00'
        }
    },
    donationInLast30Days: {
        type: Number,
        default: 0
    },

});


templeSchema.index({ templeName: 'text' });

const Temple = mongoose.model('Temple', templeSchema);
export default Temple;