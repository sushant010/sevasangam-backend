import mongoose from 'mongoose';
const { Schema } = mongoose;

// Donation Schema
const donationSchema = new Schema({
    amount: {
        type: Number,
        required: false,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
    },
    method: {
        type: String,
        required: true,
    },
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
    razorpay_order_id: {
        type: String,
        required: true,
    },
    razorpay_payment_id: {
        type: String,
        required: false,
    },
    razorpay_signature: {
        type: String,
        required: false,
    },
    isAnonymous: {
        type: Boolean,
        default: false,
        required: false,
    },
});

// Export the Donation model
const Donation = mongoose.model('Donation', donationSchema);
export default Donation;
