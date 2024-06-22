import Temple from '../models/templeModel.js';
import userModel from '../models/userModel.js';
import mongoose from 'mongoose';
import cloudinary from '../config/cloudinary.js';



export const createTemple = async (req, res) => {
  try {
    const { body } = req;

    const { templeName, location, bankDetails, contactPerson } = body;
    const { address } = location;


    if (!templeName || !address) {
      return res.status(200).send({ success: false, message: 'Temple name and address are required' });
    }

    const existingTemple = await Temple.findOne({
      templeName,
      'location.address': location.address,
    });

    if (existingTemple) {
      return res.status(200).send({ success: false, message: 'Temple already exists at this location!' });
    }


    if (!location.address || !location.city || !location.state || !location.country || !location.zipCode) {
      return res.status(200).send({ success: false, message: 'Temple Address is required' });
    }

    if (!bankDetails.bankName || !bankDetails.branch || !bankDetails.accountHolderName || !bankDetails.accountNumber || !bankDetails.ifscCode) {
      return res.status(200).send({ success: false, message: 'Bank Details are required' });
    }

    if (!contactPerson.name || !contactPerson.email || !contactPerson.mobile) {
      return res.status(200).send({ success: false, message: 'Contact Person Details are required' });
    }

    const userWhoCreated = await userModel.findOne({ _id: body.createdBy });
    if (userWhoCreated.role === 0) {
      userWhoCreated.role = 1;
      await userWhoCreated.save();
    }

    if (!userWhoCreated) {
      return res.status(404).send({ success: false, message: 'User not found' });

    }

    userWhoCreated.totalTempleCreated += 1;
    await userWhoCreated.save();

    const isVerified = userWhoCreated.role === 2 ? 1 : 0;


    const newTemple = new Temple({
      ...body,
      isVerified,
      pendingChanges: isVerified === 1 ? null : { ...body }
    });

    await newTemple.save();
    res.status(201).send({ success: true, message: isVerified === 1 ? 'Temple created successfully' : "Temple submitted for review", data: newTemple });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: 'An error occurred while creating the temple.',
    });
  }
};




export const updateTempleById = async (req, res) => {
  try {
    const { body } = req;

    // Find the existing temple
    const existingTemple = await Temple.findById(req.params.id);

    const { userUpdating } = body;

    if (!existingTemple) {
      return res.status(404).send({ success: false, message: 'Temple not found' });
    }

    // Fields to exclude from pendingChanges
    const excludeFields = [
      'createdBy',
      'donation',
      'isVerified',
      'isCreated',
      'isTrending',
      'hasChangesToApprove',
      'pendingChanges',
      'createdOn',
      'userUpdating',
      '__v'
    ];


    // Compare updated fields with previous fields
    // Recursive function to compare nested objects
    const getUpdatedFields = (newObj, oldObj, parentKey = '') => {
      const updatedFields = {};

      Object.entries(newObj).forEach(([key, value]) => {
        const fullKey = parentKey ? `${parentKey}.${key}` : key;
        if (!excludeFields.includes(fullKey)) {
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            const nestedUpdates = getUpdatedFields(value, oldObj[key] || {}, fullKey);
            if (Object.keys(nestedUpdates).length > 0) {
              updatedFields[key] = { ...oldObj[key], ...nestedUpdates };
            }
          } else {
            if (JSON.stringify(oldObj[key]) !== JSON.stringify(value)) {
              updatedFields[key] = value;
            }
          }
        }
      });

      return updatedFields;
    };


    // Compare updated fields with previous fields
    const updatedFields = getUpdatedFields(body, existingTemple.toObject());


    // Check if createdBy is superadmin
    if (userUpdating == 2) {
      // Directly verify if created by superadmin
      updatedFields.isVerified = 1;
      updatedFields.isCreated = 0;
      updatedFields.hasChangesToApprove = 0;
      updatedFields.pendingChanges = null;
      updatedFields.images = body.images ? body.images : existingTemple.images;


      // Update the temple
      const updatedTemple = await Temple.findByIdAndUpdate(req.params.id, updatedFields, { new: true, runValidators: true });

      res.status(200).send({ success: true, message: 'Temple updated successfully', data: updatedTemple });
    } else {
      // Add changes to pendingChanges, excluding specific fields
      const pendingChanges = {
        ...existingTemple.pendingChanges,
        ...Object.keys(updatedFields).reduce((acc, key) => {
          if (!excludeFields.includes(key)) {
            acc[key] = updatedFields[key];
          }
          return acc;
        }, {}),
      };


      // Update only pending changes
      const updatedTemple = await Temple.findByIdAndUpdate(req.params.id, { pendingChanges, hasChangesToApprove: 1, isCreated: 0 }, { new: true, runValidators: true });

      res.status(200).send({ success: true, message: 'Temple submitted for review', data: updatedTemple });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: 'An error occurred while updating the temple' });
  }
};




export const getAllTemples = async (req, res) => {
  try {
    const { templeName, location, isTrending, verified, templeCreatedBy } = req.query;

    let query = {};

    if (location && location.trim() !== "") {
      query.$or = [
        { 'location.address': { $regex: location, $options: 'i' } },
        { 'location.country': { $regex: location, $options: 'i' } },
        { 'location.state': { $regex: location, $options: 'i' } },
        { 'location.city': { $regex: location, $options: 'i' } }
      ];
    }

    if (templeName && templeName.trim() !== "") {
      query.templeName = { $regex: templeName, $options: 'i' };
    }

    if (isTrending && isTrending !== "false") {
      query.isTrending = true;
    }

    if (verified && verified.trim() !== "") {
      query.isVerified = verified === '1';
    }

    if (templeCreatedBy && templeCreatedBy.trim() !== "") {
      query['createdBy.name'] = { $regex: templeCreatedBy, $options: 'i' };
    }

    const temples = await Temple.find(query)
      .populate('createdBy', 'name') // Populate createdBy field with selected fields
      .select('-pendingChanges') // Exclude pendingChanges field
      .populate({
        path: 'images',
        select: 'bannerImage' // Select only necessary fields
      })
      .select('-images') // Exclude pending changes and images
      .sort({ createdOn: -1 }) // Sort by creation date in descending order
      .limit(20); // Limit the number of documents returned per page

    const count = temples.length;
    res.status(200).send({ success: true, message: 'Temples retrieved successfully', data: { count, temples } });
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: 'Failed to retrieve temples', error });
  }
};


export const searchTempleByName = async (req, res) => {

  const nameString = req.query.search;

  if (!nameString || typeof nameString !== 'string') {
    return res.status(400).send({ success: false, message: 'Enter at-least 3 character' });
  }

  try {
    const temples = await Temple.find({
      templeName: { $regex: nameString, $options: 'i' }
    });

    res.status(200).send({ success: true, message: 'Temples retrieved successfully', data: { count: temples.length, temples } });
  } catch (error) {
    console.log(error)
    res.status(500).send({ success: false, message: 'Failed to retrieve temples' });
  }

}


export const getAllVerifiedTemples = async (req, res) => {
  try {

    const { templeName, location, isTrending } = req.query;

    let dbQuery = {
      $or: []
    }

    if (location && location !== null && location.trim() !== "") {
      // { 'location.address': { $regex: address, $options: 'i' } },
      dbQuery.$or.push(
        { 'location.address': { $regex: location, $options: 'i' } },
      )
      dbQuery.$or.push(
        { 'location.country': { $regex: location, $options: 'i' } },
      )
      dbQuery.$or.push(
        { 'location.state': { $regex: location, $options: 'i' } },
      )
      dbQuery.$or.push(
        { 'location.city': { $regex: location, $options: 'i' } },
      )
    }



    if (templeName && templeName !== null && templeName.trim() !== "") {
      dbQuery.templeName = { $regex: templeName, $options: 'i' };
    }

    if (isTrending && isTrending !== "false") {
      console.log(isTrending)
      dbQuery.isTrending = 1
    }



    if (dbQuery.$or.length === 0) {
      delete dbQuery.$or
    }

    const temples = await Temple.find({ ...dbQuery, isVerified: 1 }).populate('createdBy')
    // .populate('createdBy');
    const count = temples.length;
    res.status(200).send({ success: true, message: 'Temples retrieved successfully', data: { count, temples } });
  } catch (error) {
    console.log(error)
    res.status(500).send({ success: false, message: 'Failed to retrieve temples', error });
  }
};


// Get a single temple by ID
export const getTempleById = async (req, res) => {
  try {
    const temple = await Temple.findById(req.params.id).populate('createdBy').select('-pendingChanges')
      ;
    if (!temple) {
      return res.status(404).send({ success: false, message: 'Temple not found' });
    }
    res.status(200).send({ success: true, message: 'Temple retrieved successfully', data: temple });
  } catch (error) {
    res.status(500).send({ success: false, message: 'Failed to retrieve temple', error });
  }
};


// Get a single temple by Name
export const getTempleByName = async (req, res) => {
  try {
    const decodedName = decodeURIComponent(req.params.name);
    const temple = await Temple.findOne({ templeName: decodedName });
    if (!temple) {
      return res.status(404).send({ success: false, message: 'Temple not found' });
    }
    res.status(200).send({ success: true, message: 'Temple retrieved successfully', data: temple });
  } catch (error) {
    res.status(500).send({ success: false, message: 'Failed to retrieve temple', error });
  }
};



// Delete a temple by ID
export const deleteTempleById = async (req, res) => {
  try {
    const temple = await Temple.findByIdAndDelete(req.params.id).select('-pendingChanges')
      .select('-images') // Exclude pending changes and images
    const userWhoCreated = await userModel.findOne({ _id: temple.createdBy });
    userWhoCreated.totalTempleCreated -= 1;
    await userWhoCreated.save();
    if (!temple) {
      return res.status(404).send({ success: false, message: 'Temple not found' });
    }
    res.status(200).send({ success: true, message: 'Temple deleted successfully', data: temple });
  } catch (error) {
    console.log(error)
    res.status(500).send({ success: false, message: 'Failed to delete temple', error });
  }
};

// Filter Routes

// Get all temples created by a user
export const getAllTemplesByAdmin = async (req, res) => {
  const { templeName, verified } = req.body;

  try {

    const temples = await Temple.aggregate([
      {
        $match: {
          createdBy: new mongoose.Types.ObjectId(req.body.userId),
          templeName: { $regex: templeName ? templeName : '', $options: 'i' },
          ...(verified && verified !== '' && { isVerified: verified === '1' ? 1 : { $ne: 1 } })
        }
      }

    ])
    const count = temples.length;
    res.status(200).send({ success: true, message: 'Temples retrieved successfully', data: { count, temples } });
  } catch (error) {
    res.status(500).send({ success: false, message: 'Failed to retrieve temples', error });
  }
};

// Get all temples created by a user of a time range
// export const getAllTemplesByAdminForTimerange = async (req, res) => {
//   try {
//     const temples = await Temple.find().populate('createdBy').where('createdBy', req.user._id).where('createdAt').gte(req.query.startDate).lte(req.query.endDate);
//     const count = temples.length;
//     res.status(200).send({ success: true, message: 'Temples retrieved successfully', data: { count, temples } });
//   } catch (error) {
//     res.status(500).send({ success: false, message: 'Failed to retrieve temples', error });
//   }
// };


export const getUnverifiedNewlyCreatedTemples = async (req, res) => {

  try {
    const temples = await Temple.find({ isVerified: 0, isCreated: 1 }).populate('createdBy').select('-images').select('-pendingChanges');
    const count = temples.length;
    res.status(200).send({ success: true, message: 'Temples retrieved successfully', data: { count, temples } });
  } catch (error) {
    res.status(500).send({ success: false, message: 'Failed to retrieve temples', error });
  }

}

export const getUnverifiedUpdatedByAdminTemples = async (req, res) => {

  try {
    const temples = await Temple.find({ hasChangesToApprove: 1 }).populate('createdBy').select('-images').select('-pendingChanges');
    const count = temples.length;
    res.status(200).send({ success: true, message: 'Temples retrieved successfully', data: { count, temples } });
  } catch (error) {
    res.status(500).send({ success: false, message: 'Failed to retrieve temples', error });
  }

}


export const verifyTemple = async (req, res) => {
  try {
    const { id } = req.params;
    const temple = await Temple.findById(id).select('_id');
    if (temple.pendingChanges) {
      // Apply pending changes
      Object.assign(temple, temple.pendingChanges, { pendingChanges: null });
    }

    temple.isVerified = 1;
    temple.hasChangesToApprove = 0;

    const updatedTemple = await temple.save();

    res.status(200).send({ success: true, message: 'Pending changes approved and temple verified successfully', data: { temple: updatedTemple } });
  } catch (error) {
    res.status(500).send({ success: false, message: 'Failed to approve pending changes', error });
  }
}





export const getFilteredTemples = async (req, res) => {
  try {
    // Extract filters and options from the request body
    const {
      templeName,
      typeOfOrganization,
      address,
      isVerified,
      sortOption,
      state,
      city
    } = req.body; // Note: Using `req.query` for GET requests

    // Remove empty strings from the request body
    Object.keys(req.body).forEach(key => req.body[key] === '' && delete req.body[key]);

    // Set default values for pagination
    const page = parseInt(req.body.page) || 1; // Default page number is 1
    const limit = req.body.limit ? req.body.limit : 20; // Default limit is 20 temples per page

    // Initialize query and sort objects
    let query = {};
    let sort = {};

    // Filter by temple name using text search and set sort order by relevance
    if (templeName) {
      query.$text = { $search: templeName };
      sort = {
        score: { $meta: 'textScore' },
        createdOn: -1
      };
    }

    // Filter by type of organization using regex for case-insensitive search
    if (typeOfOrganization) query.typeOfOrganization = { $regex: typeOfOrganization, $options: 'i' };

    // Filter by address using regex for case-insensitive search
    if (address) {
      query.$or = [
        { 'location.address': { $regex: address, $options: 'i' } },
        { 'location.country': { $regex: address, $options: 'i' } },
        { 'location.state': { $regex: address, $options: 'i' } },
        { 'location.city': { $regex: address, $options: 'i' } }
      ];
    }

    // Filter by verification status
    if (isVerified) query.isVerified = isVerified === '1';

    // Filter by state and city
    if (state) query['location.state'] = state;
    if (city) query['location.city'] = city;

    // Additional sorting options based on provided sortOption
    if (sortOption) {
      if (sortOption === 'mostPopular') {
        sort.donationInLast30Days = -1; // Sort by donation in descending order (most popular)
      } else if (sortOption === 'recentlyAdded') {
        sort.createdOn = -1; // Sort by creation date in descending order (recently added)
      } else if (sortOption === 'trending') {
        query.isTrending = 1; // Filter by trending status
        sort.isTrending = -1; // Sort by trending status in descending order
      }
    } else {
      sort.donationInLast30Days = -1;
    }

    // Query the database for temples matching the filters and sort options
    const temples = await Temple.find({
      isVerified: 1,
      ...query
    })
      .populate('createdBy')
      .select('-pendingChanges')
      .populate({
        path: 'images',
        select: 'bannerImage' // Select only necessary fields
      })
      .select('-images') // Exclude pending changes and images
      .sort(sort) // Apply sorting
      .skip((page - 1) * limit) // Skip the documents for pagination
      .limit(limit); // Limit the number of documents returned per page



    // Send the response with the filtered temples and the count
    res.status(200).send({ success: true, message: 'Filtered temples retrieved successfully', data: { temples }, count: temples.length });
  } catch (error) {
    console.log(error)
    res.status(500).send({ success: false, message: 'Failed to retrieve temples', error });
  }
};

//get creators 

export const getTempleCreators = async (req, res) => {
  const { templeNameSearchString, creatorSearchString } = req.query;

  console.log(templeNameSearchString, creatorSearchString)
  try {


    const creatorsNameArr = await Temple.aggregate([
      {
        $match: {
          templeName: { $regex: templeNameSearchString ? '' : '', $options: 'i' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'creator'
        }
      },
      {
        $unwind: '$creator'
      },
      {
        $match: {
          'creator.name': {
            $regex: creatorSearchString ? creatorSearchString : ''
            , $options: 'i'
          }
        }
      },
      // project only unique creator names array
      {
        $group: {
          _id: '$creator.name'
        }
      },
      {
        $project: {
          _id: 0,
          name: '$_id'
        }
      }


    ]);
    return res.status(200).send({ success: true, data: creatorsNameArr });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ success: false, message: 'An error occurred while fetching creators' });
  }
}


export const getAllStatesOfTemples = async (req, res) => {


  const temples = await Temple.find({}).select('location.state');
  const statesSet = new Set(temples.map(t => t.location.state).filter(v => v !== undefined && v !== null && v !== ''))
  const states = Array.from(statesSet);
  res.send({ success: true, data: states });

}

export const getAllCitiesOfTemples = async (req, res) => {


  const temples = await Temple.find({}).select('location.city');
  const CitiesSet = new Set(temples.map(t => t.location.city).filter(v => v !== undefined && v !== null && v !== ''))
  const cities = Array.from(CitiesSet);
  res.send({ success: true, data: cities });

}


// Reject a temple
export const rejectTemple = async (req, res) => {
  try {
    const { id } = req.body;



    const temple = await Temple.findById(id).populate('createdBy').select('-images');

    if (!temple) {
      return res.status(404).send({ success: false, message: 'Temple not found' });
    }

    if (temple.isCreated === 1) {
      findByIdAndDelete(temple._id)
      const user = await userModel.findById(temple.createdBy._id);
      user.totalTempleCreated -= 1;
      await user.save();
      return res.status(200).send({ success: true, message: 'New Temple request rejected successfully' });
    } else {
      const temple = await Temple.findByIdAndUpdate(id, {
        hasChangesToApprove: 0,
        pendingChanges: null,
        isVerified: 1
      }, { new: true }).select('-pendingChanges')
        .select('-images') // Exclude pending changes and images
    }

    res.status(200).send({ success: true, message: 'Temple changes rejected successfully' });
  } catch (error) {
    res.status(500).send({ success: false, message: 'Failed to reject temple', error });
  }
};



export const reviewPendingChanges = async (req, res) => {
  try {
    const temple = await Temple.findById(req.params.id).populate('createdBy');

    if (!temple) {
      return res.status(404).send({ success: false, message: 'Temple not found' });
    }

    if (!temple.pendingChanges) {
      return res.status(200).send({ success: false, message: 'No pending changes for this temple' });
    }
    const createdBy = await userModel.findById(temple.createdBy);

    res.status(200).send({ success: true, message: 'Pending changes retrieved successfully', data: temple.pendingChanges, createdBy });
  } catch (error) {
    res.status(500).send({ success: false, message: 'Failed to retrieve pending changes', error });
  }
};

export const getSearchSuggestionTempleName = async (req, res) => {
  const { search } = req.query;
  if (!search) {
    return res.status(400).send({ success: false, message: 'Search term is required' });
  }

  try {
    const temples = await Temple.find({
      templeName: { $regex: search, $options: 'i' }
    }).limit(10).select('-pendingChanges')
      .select('-images') // Exclude pending changes and images
    res.send({ success: true, data: temples });
  } catch (error) {
    res.status(500).send({ success: false, message: 'Error fetching suggestions', error });
  }

}



export const getSimilarTemples = async (req, res) => {
  try {
    const id = req.params.id // Note: Using `req.query` for GET requests

    const limit = req.body.limit ? req.body.limit : 4; // Number of temples to fetch per page

    const refTemple = await Temple.findById(id);


    const typeOfOrganization = refTemple.typeOfOrganization;

    const temples = await Temple.find({ typeOfOrganization }).populate('createdBy').limit(limit).select('-pendingChanges').populate({
      path: 'images',
      select: 'bannerImage' // Select only necessary fields
    })
      .select('-images') // Exclude pending changes and images

    res.status(200).send({ success: true, message: 'Filtered temples retrieved successfully', data: { temples } });
  } catch (error) {
    res.status(500).send({ success: false, message: 'Failed to retrieve temples', error });
  }
};



export const getTrendingTemples = async (req, res) => {
  try {

    const limit = parseInt(req.query.limit, 10) || 0;
    const temples = await Temple.find({ isVerified: 1, isTrending: 1 }).limit(limit);


    res.status(200).send({ success: true, message: 'Trending temples retrieved successfully', data: { temples } });
  } catch (error) {
    res.status(500).send({ success: false, message: 'Failed to retrieve temples', error });
  }
};

export const addTrendingTemple = async (req, res) => {
  try {

    const { id } = req.params;

    await Temple.findByIdAndUpdate(id, { isTrending: 1 });

    res.status(200).send({ success: true, message: 'Trending temples updated successfully' });
  } catch (error) {
    res.status(500).send({ success: false, message: 'Failed to retrieve temples', error });
  }
};


export const removeTrendingTemple = async (req, res) => {
  try {

    const { id } = req.params;

    await Temple.findByIdAndUpdate(id, { isTrending: 0 });

    res.status(200).send({ success: true, message: 'Trending temples updated successfully' });
  } catch (error) {
    res.status(500).send({ success: false, message: 'Failed to retrieve temples', error });
  }
};

// not being used
export const getAllImages = async (req, res) => {
  try {

    const templesImages = await Temple.find({ isVerified: 1 }).select('images');

    res.status(200).send({ success: true, message: 'Trending temples updated successfully', templesImages });
  } catch (error) {
    res.status(500).send({ success: false, message: 'Failed to retrieve temples', error });
  }
};






