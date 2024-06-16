import mongoose from 'mongoose';
const { Schema } = mongoose;

// Subscription Schema
const subscriptionSchema = new Schema({
    amount: {
        type: Number,
        required: false,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    // method: {
    //     type: String,
    //     required: true,
    // },
    status: {
        type: String,
        required: true,
    },
    currency: {
        type: String,
        required: true,
    },
    donateUser: {
        type: String,
        required: true,
    },
    temple: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Temple',
        required: true,
    },
    is80CertificateRequested: {
        type: Boolean,
        default: false,
    },
    certificate:
    {
        type: String,
        required: false
    },
    subscription_id: {
        type: String,
        required: true,
    },
    plan_id: {
        type: String,
        required: false,
    },
});

// Export the Subscription model
const Subscription = mongoose.model('Subscription', subscriptionSchema);
export default Subscription;
