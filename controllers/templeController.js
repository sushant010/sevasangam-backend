import Temple from '../models/templeModel.js';

// Create a new temple
export const createTemple = async (req, res) => {
  const temple = new Temple(req.body);
  const { templeName, location } = req.body;
  const address = location.address;

  const existingTemple = await Temple.findOne({ 
    templeName, 
    'location.address': address 
  });

  if (existingTemple) {
    return res.status(400).send({ success: false, message: 'Temple already exists at this location' });
  }

  await temple.save();
  res.status(201).send({ success: true, message: 'Temple created successfully', data: temple });
};

// Get all temples
export const getAllTemples = async (req, res) => {
  try {
    const temples = await Temple.find().populate('createdBy');
    const count = temples.length;
    res.status(200).send({ success: true, message: 'Temples retrieved successfully', data: {count, temples} });
  } catch (error) {
    res.status(500).send({ success: false, message: 'Failed to retrieve temples', error });
  }
};

// Get a single temple by ID
export const getTempleById = async (req, res) => {
  try {
    const temple = await Temple.findById(req.params.id).populate('createdBy');
    if (!temple) {
      return res.status(404).send({ success: false, message: 'Temple not found' });
    }
    res.status(200).send({ success: true, message: 'Temple retrieved successfully', data: temple });
  } catch (error) {
    res.status(500).send({ success: false, message: 'Failed to retrieve temple', error });
  }
};

// Update a temple by ID
export const updateTempleById = async (req, res) => {
  try {
    const temple = await Temple.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!temple) {
      return res.status(404).send({ success: false, message: 'Temple not found' });
    }
    res.status(200).send({ success: true, message: 'Temple updated successfully', data: temple });
  } catch (error) {
    res.status(400).send({ success: false, message: 'Failed to update temple', error });
  }
};

// Delete a temple by ID
export const deleteTempleById = async (req, res) => {
  try {
    const temple = await Temple.findByIdAndDelete(req.params.id);
    if (!temple) {
      return res.status(404).send({ success: false, message: 'Temple not found' });
    }
    res.status(200).send({ success: true, message: 'Temple deleted successfully', data: temple });
  } catch (error) {
    res.status(500).send({ success: false, message: 'Failed to delete temple', error });
  }
};
