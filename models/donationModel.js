import mongoose from 'mongoose';
const { Schema } = mongoose;

// Donation Schema
const donationSchema = new Schema({
    amount: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    temple: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Temple',
        required: true,
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['credit card', 'debit card', 'paypal', 'bank transfer'],
    },
    transactionId: {
        type: String,
        required: true,
        unique: true,
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending',
    },
});

// Export the Donation model
const Donation = mongoose.model('Donation', donationSchema);
export default Donation;
