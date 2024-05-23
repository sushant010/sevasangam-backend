import mongoose from 'mongoose';
const { Schema } = mongoose;

// Donation Schema
const paymentSchema = new Schema({

    razorpay_order_id: {
        type: String,
        required: true,
    },
    razorpay_payment_id: {
        type: String,
        required: true,
    },
    razorpay_signature: {
        type: String,
        required: true,
    },
});

// Export the Donation model
const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
