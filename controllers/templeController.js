import Temple from '../models/templeModel.js';
import userModel from '../models/userModel.js';

// Create a new temple
export const createTemple = async (req, res) => {
  try {
    const { body, files } = req;
    const parsedBody = {};

    // Iterate through keys of req.body
    Object.keys(body).forEach(key => {
      // Check if key contains a period (indicating nested key)
      if (key.includes('.')) {
        const [parentKey, childKey] = key.split('.'); // Split key into parent and child keys
        parsedBody[parentKey] = parsedBody[parentKey] || {}; // Ensure parent key exists in parsed body
        parsedBody[parentKey][childKey] = body[key]; // Assign value to nested object
      } else {
        parsedBody[key] = body[key]; // Assign value to top-level key
      }
    });


    const { templeName, location, createdBy } = parsedBody;
    const { address } = location;


    if (!templeName || !address) {
      return res.status(400).send({ success: false, message: 'Temple name and address are required' });
    }

    const existingTemple = await Temple.findOne({
      templeName,
      'location.address': address,
    });

    if (existingTemple) {
      return res.status(200).send({ success: false, message: 'Temple already exists at this location!' });
    }


    // Process file paths
    const images = {};
    if (files['images.logo']) {
      images.logo = files['images.logo'][0].path;
    }
    if (files['images.templeBannerImage']) {
      images.templeBannerImage = files['images.templeBannerImage'][0].path;
    }
    if (files['images.templeImages']) {
      images.templeImages = files['images.templeImages'].map((file) => file.path);
    }

    const userWhoCreated = await userModel.findOne({ _id: createdBy });
    if (!userWhoCreated) {
      return res.status(404).send({ success: false, message: 'User not found' });
    }

    userWhoCreated.totalTempleCreated += 1;
    userWhoCreated.role = 1;
    await userWhoCreated.save();

    const newTemple = new Temple({
      ...body,
      images,
    });

    await newTemple.save();
    res
      .status(201)
      .send({ success: true, message: 'Temple created successfully', data: newTemple });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: 'An error occurred while creating the temple.',
    });
  }
};

// Get all temples
export const getAllTemples = async (req, res) => {
  try {
    const temples = await Temple.find().populate('createdBy');
    const count = temples.length;
    res.status(200).send({ success: true, message: 'Temples retrieved successfully', data: { count, temples } });
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
    const { body, files } = req;

    // Process file paths
    const images = {};
    if (files) {
      if (files['images.logo']) {
        images.logo = files['images.logo'][0].path;
      }
      if (files['images.templeBannerImage']) {
        images.templeBannerImage = files['images.templeBannerImage'][0].path;
      }
      if (files['images.templeImages']) {
        images.templeImages = files['images.templeImages'].map((file) => file.path);
      }
    }

    // Update each subfield of the images object individually
    const updatedTemple = await Temple.findByIdAndUpdate(req.params.id, {
      ...body,
      'images.logo': images.logo || body.images.logo,
      'images.templeBannerImage': images.templeBannerImage || body.images.templeBannerImage,
      'images.templeImages': images.templeImages || body.images.templeImages,
    }, { new: true, runValidators: true });

    if (!updatedTemple) {
      return res.status(404).send({ success: false, message: 'Temple not found' });
    }

    res.status(200).send({ success: true, message: 'Temple updated successfully', data: updatedTemple });
  } catch (error) {
    console.error(error);
    res.status(400).send({ success: false, message: 'Failed to update temple', error });
  }
};


// Delete a temple by ID
export const deleteTempleById = async (req, res) => {
  try {
    const temple = await Temple.findByIdAndDelete(req.params.id);
    const userWhoCreated = await userModel.findOne({ _id: temple.createdBy });
    userWhoCreated.totalTempleCreated -= 1;
    await userWhoCreated.save();
    if (!temple) {
      return res.status(404).send({ success: false, message: 'Temple not found' });
    }
    res.status(200).send({ success: true, message: 'Temple deleted successfully', data: temple });
  } catch (error) {
    res.status(500).send({ success: false, message: 'Failed to delete temple', error });
  }
};

// Filter Routes

// Get all temples created by a user
export const getAllTemplesByAdmin = async (req, res) => {
  try {
    const temples = await Temple.find({ createdBy: req.body.userId }).populate('createdBy');
    const count = temples.length;
    res.status(200).send({ success: true, message: 'Temples retrieved successfully', data: { count, temples } });
  } catch (error) {
    res.status(500).send({ success: false, message: 'Failed to retrieve temples', error });
  }
};

// Get all temples created by a user of a time range
export const getAllTemplesByAdminForTimerange = async (req, res) => {
  try {
    const temples = await Temple.find().populate('createdBy').where('createdBy', req.user._id).where('createdAt').gte(req.query.startDate).lte(req.query.endDate);
    const count = temples.length;
    res.status(200).send({ success: true, message: 'Temples retrieved successfully', data: { count, temples } });
  } catch (error) {
    res.status(500).send({ success: false, message: 'Failed to retrieve temples', error });
  }
};

export const getUnverifiedTemples = async (req, res) => {

  try {
    const temples = await Temple.find({ isVerified: false }).populate('createdBy');
    const count = temples.length;
    res.status(200).send({ success: true, message: 'Temples retrieved successfully', data: { count, temples } });
  } catch (error) {
    res.status(500).send({ success: false, message: 'Failed to retrieve temples', error });
  }

}
export const getFilteredTemples = async (req, res) => {
  try {
    const {
      templeName,
      typeOfOrganization,
      address,
      isVerified,
      sortOption,
      state,
      city
    } = req.body;

    let query = {};

    if (templeName) query.templeName = { $regex: templeName, $options: 'i' };
    if (typeOfOrganization) query.typeOfOrganization = { $regex: typeOfOrganization, $options: 'i' };
    if (address) {
      query.$or = [
        { 'location.address': { $regex: address, $options: 'i' } },
        { 'location.country': { $regex: address, $options: 'i' } },
        { 'location.state': { $regex: address, $options: 'i' } },
        { 'location.city': { $regex: address, $options: 'i' } }
      ];
    }
    if (isVerified) query.isVerified = isVerified === '1';
    if (state) query['location.state'] = state;
    if (city) query['location.city'] = city;

    let sort = {};
    if (sortOption) {
      if (sortOption === 'mostPopular') {
        sort.donation = -1; // Assuming 'donation' is a field representing popularity
      } else if (sortOption === 'recentlyAdded') {
        sort.createdOn = -1;
      }
    }

    const temples = await Temple.find(query).populate('createdBy').sort(sort);

    res.status(200).send({ success: true, message: 'Filtered temples retrieved successfully', data: { temples } });
  } catch (error) {
    res.status(500).send({ success: false, message: 'Failed to retrieve temples', error });
  }
};


