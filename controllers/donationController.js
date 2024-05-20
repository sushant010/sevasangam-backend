import Donation from '../models/donationModel.js';

// Create a donation
export const createDonation = async (req, res) => {
    try {
        const { amount, user, temple, paymentMethod, transactionId } = req.body;

        const newDonation = new Donation({
            amount,
            user,
            temple,
            paymentMethod,
            transactionId,
            status: 'pending', // Default status
        });

        const savedDonation = await newDonation.save();
        res.status(201).json({ success: true, data: savedDonation });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all donations
export const getDonations = async (req, res) => {
    try {
        const donations = await Donation.find().populate('user', 'name email').populate('temple', 'name location');
        res.status(200).json({ success: true, data: donations });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get a donation by ID
export const getDonationById = async (req, res) => {
    try {
        const { id } = req.params;
        const donation = await Donation.findById(id).populate('user', 'name email').populate('temple', 'name location');

        if (!donation) {
            return res.status(404).json({ success: false, message: 'Donation not found' });
        }

        res.status(200).json({ success: true, data: donation });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update a donation
export const updateDonation = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, user, temple, paymentMethod, status } = req.body;

        const updatedDonation = await Donation.findByIdAndUpdate(
            id,
            { amount, user, temple, paymentMethod, status },
            { new: true }
        );

        if (!updatedDonation) {
            return res.status(404).json({ success: false, message: 'Donation not found' });
        }

        res.status(200).json({ success: true, data: updatedDonation });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete a donation
export const deleteDonation = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedDonation = await Donation.findByIdAndDelete(id);

        if (!deletedDonation) {
            return res.status(404).json({ success: false, message: 'Donation not found' });
        }

        res.status(200).json({ success: true, message: 'Donation deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
