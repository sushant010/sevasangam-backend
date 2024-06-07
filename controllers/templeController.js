import Temple from '../models/templeModel.js';
import userModel from '../models/userModel.js';
import cloudinary from '../config/cloudinary.js';



export const createTemple = async (req, res) => {
  try {
    const { body, files } = req;
    const parsedBody = {};

    Object.keys(body).forEach(key => {
      if (key.includes('.')) {
        const [parentKey, childKey] = key.split('.');
        parsedBody[parentKey] = parsedBody[parentKey] || {};
        parsedBody[parentKey][childKey] = body[key];
      } else {
        parsedBody[key] = body[key];
      }
    });

    const { templeName, location, createdBy } = parsedBody;
    const { address } = location;

    if (!templeName || !address) {
      return res.status(400).send({ success: false, message: 'Temple name and address are required' });
    }

    const existingTemple = await Temple.findOne({
      templeName,
      'location.address': location.address,
    });

    if (existingTemple) {
      return res.status(200).send({ success: false, message: 'Temple already exists at this location!' });
    }

    const images = {};
    if (files.logo) {
      images.logo = files.logo[0].path;
    }
    if (files.bannerImage) {
      images.bannerImage = files.bannerImage[0].path;
    }
    if (files.otherImages) {
      images.otherImages = files.otherImages.map(file => file.path);
    }

    const userWhoCreated = await userModel.findOne({ _id: parsedBody.createdBy });
    if (!userWhoCreated) {
      return res.status(404).send({ success: false, message: 'User not found' });
    }

    userWhoCreated.totalTempleCreated += 1;
    await userWhoCreated.save();

    const isVerified = userWhoCreated.role === 2 ? 1 : 0;

    const newTemple = new Temple({
      ...parsedBody,
      images,
      isVerified,
      pendingChanges: isVerified === 1 ? null : { ...parsedBody, images }
    });

    await newTemple.save();
    res.status(201).send({ success: true, message: isVerified === 1 ? 'Temple created successfully' : "Temple submitted for review", data: newTemple });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: 'An error occurred while creating the temple.',
    });
  }
};




// export const updateTempleById = async (req, res) => {
//   try {
//     const { body, files } = req;
//     const parsedBody = {};

//     // console.log(body)

//     // Parse the body to handle nested fields
//     Object.keys(body).forEach(key => {
//       if (key.includes('.')) {
//         const [parentKey, childKey] = key.split('.');
//         parsedBody[parentKey] = parsedBody[parentKey] || {};
//         parsedBody[parentKey][childKey] = body[key];
//       } else {
//         parsedBody[key] = body[key];
//       }
//     });

//     // Find the existing temple
//     const existingTemple = await Temple.findById(req.params.id);

//     if (!existingTemple) {
//       return res.status(404).send({ success: false, message: 'Temple not found' });
//     }

//     // Compare updated fields with previous fields
//     const updatedFields = {};
//     console.log(parsedBody)

//     Object.keys(parsedBody).forEach(key => {
//       // Check if the field has changed
//       const existingValue = existingTemple[key];
//       const newValue = parsedBody[key];

//       if (JSON.stringify(existingValue) !== JSON.stringify(newValue)) {
//         updatedFields[key] = newValue;
//       }
//     });

//     // Prepare updated data
//     let updatedData = {
//       ...existingTemple.toObject(),
//       ...updatedFields,
//     };

//     // Handle image updates
//     const updatedImages = {};
//     if (files.logo) {
//       updatedImages.logo = files.logo[0].path;
//     }
//     if (files.bannerImage) {
//       updatedImages.bannerImage = files.bannerImage[0].path;
//     }
//     if (files.otherImages) {
//       updatedImages.otherImages = files.otherImages.map(file => file.path);
//     }

//     updatedData.images = {
//       ...existingTemple.images,
//       ...updatedImages
//     };

//     // Check if createdBy is superadmin
//     if (parsedBody.createdBy && parsedBody.createdBy.role === 2) {
//       // Directly verify if created by superadmin
//       updatedData.isVerified = 1;
//       updatedData.isCreated = 0;
//       updatedData.pendingChanges = null;
//     } else {
//       // Merge pending changes
//       const mergedPendingChanges = {
//         ...existingTemple.pendingChanges,
//         ...updatedFields,
//         images: {
//           ...existingTemple.pendingChanges?.images,
//           ...updatedImages
//         }
//       };

//       updatedData = {
//         ...updatedData,
//         pendingChanges: mergedPendingChanges,
//         hasChangesToApprove: 1,
//         isCreated: 0
//       };
//     }

//     // Update the temple
//     const updatedTemple = await Temple.findByIdAndUpdate(req.params.id, updatedData, { new: true, runValidators: true });

//     res.status(200).send({ success: true, message: updatedData.isVerified === 1 ? 'Temple updated successfully' : 'Temple submitted for review', data: updatedTemple });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send({ success: false, message: 'An error occurred while updating the temple' });
//   }
// };

export const updateTempleById = async (req, res) => {
  try {
    const { body, files } = req;
    const parsedBody = {};

    // Parse the body to handle nested fields
    Object.keys(body).forEach(key => {
      if (key.includes('.')) {
        const [parentKey, childKey] = key.split('.');
        parsedBody[parentKey] = parsedBody[parentKey] || {};
        parsedBody[parentKey][childKey] = body[key];
      } else {
        parsedBody[key] = body[key];
      }
    });

    // Find the existing temple
    const existingTemple = await Temple.findById(req.params.id);

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
      '__v'
    ];


    // Compare updated fields with previous fields
    const updatedFields = {};


    Object.keys(parsedBody).forEach(key => {
      // Check if the field has changed
      const existingValue = existingTemple[key];
      const newValue = parsedBody[key];

      if (JSON.stringify(existingValue) === JSON.stringify(newValue)) {
        updatedFields[key] = newValue;
      }
    });



    // Prepare updated data
    let updatedData = {
      ...existingTemple.toObject(),
      ...updatedFields,
    };

    // Handle image updates
    const updatedImages = {};
    if (files.logo) {
      updatedImages.logo = files.logo[0].path;
    }
    if (files.bannerImage) {
      updatedImages.bannerImage = files.bannerImage[0].path;
    }
    if (files.otherImages) {
      updatedImages.otherImages = files.otherImages.map(file => file.path);
    }

    updatedData.images = {
      ...existingTemple.images,
      ...updatedImages
    };

    // Check if createdBy is superadmin
    if (parsedBody.createdBy && parsedBody.createdBy.role === 2) {
      // Directly verify if created by superadmin
      updatedData.isVerified = 1;
      updatedData.isCreated = 0;
      updatedData.hasChangesToApprove = 0;
      updatedData.pendingChanges = null;

      // Update the temple
      const updatedTemple = await Temple.findByIdAndUpdate(req.params.id, updatedData, { new: true, runValidators: true });

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
        images: {
          ...existingTemple.pendingChanges?.images,
          ...updatedImages
        }
      };

      // Update only pending changes
      const updatedTemple = await Temple.findByIdAndUpdate(req.params.id, { pendingChanges, hasChangesToApprove: 1 }, { new: true, runValidators: true });

      res.status(200).send({ success: true, message: 'Temple submitted for review', data: updatedTemple });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: 'An error occurred while updating the temple' });
  }
};





// Get all temples
export const getAllTemples = async (req, res) => {
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

    console.log(dbQuery)
    const temples = await Temple.find({ ...dbQuery }).populate('createdBy');

    // .populate('createdBy');
    const count = temples.length;
    res.status(200).send({ success: true, message: 'Temples retrieved successfully', data: { count, temples } });
  } catch (error) {
    console.log(error)
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
    const temple = await Temple.findById(req.params.id);
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
    const temple = await Temple.findByIdAndDelete(req.params.id);
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
  try {
    const temples = await Temple.find({ createdBy: req.body.userId }).populate('createdBy');
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
    const temples = await Temple.find({ isVerified: 0, isCreated: 1 }).populate('createdBy');
    const count = temples.length;
    res.status(200).send({ success: true, message: 'Temples retrieved successfully', data: { count, temples } });
  } catch (error) {
    res.status(500).send({ success: false, message: 'Failed to retrieve temples', error });
  }

}

export const getUnverifiedUpdatedByAdminTemples = async (req, res) => {

  try {
    const temples = await Temple.find({ hasChangesToApprove: 1, isCreated: 0 }).populate('createdBy');
    const count = temples.length;
    res.status(200).send({ success: true, message: 'Temples retrieved successfully', data: { count, temples } });
  } catch (error) {
    res.status(500).send({ success: false, message: 'Failed to retrieve temples', error });
  }

}


export const verifyTemple = async (req, res) => {
  try {
    const { id } = req.params;
    const temple = await Temple.findById(id);
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
    const {
      templeName,
      typeOfOrganization,
      address,
      isVerified,
      sortOption,
      state,
      city
    } = req.body; // Note: Using `req.query` for GET requests

    //remove empty strings
    Object.keys(req.body).forEach(key => req.body[key] === '' && delete req.body[key]);

    const page = parseInt(req.body.page) || 1; // Parse page number from request body, default to 1 if not provided

    const limit = req.body.limit ? req.body.limit : 8; // Number of temples to fetch per page

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
      } else if (sortOption === 'trending') {
        query.isTrending = 1;
        sort.isTrending = -1;
      }
    }

    // const temples = await Temple.find({ isVerified: 1 })
    //   .populate('createdBy')
    //   .sort(sort)
    // .skip((page - 1) * limit) // Skip the required number of documents
    // .limit(limit); // Limit the number of documents returned per page

    const temples = await Temple.find({
      isVerified: 1,
      ...query
    })
      .populate('createdBy')
      .sort(sort)
      .skip((page - 1) * limit) // Skip the required number of documents
      .limit(limit); // Limit the number of documents returned per page


    res.status(200).send({ success: true, message: 'Filtered temples retrieved successfully', data: { temples } });
  } catch (error) {
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


// Reject a temple
export const rejectTemple = async (req, res) => {
  try {
    const { id } = req.body;

    const temple = await Temple.findByIdAndUpdate(id, {
      hasChangesToApprove: 0,
      pendingChanges: null,
      isVerified: 1
    }, { new: true });

    if (!temple) {
      return res.status(404).send({ success: false, message: 'Temple not found' });
    }

    res.status(200).send({ success: true, message: 'Temple rejected successfully', data: temple });
  } catch (error) {
    res.status(500).send({ success: false, message: 'Failed to reject temple', error });
  }
};



export const reviewPendingChanges = async (req, res) => {
  try {
    const temple = await Temple.findById(req.params.id);

    if (!temple) {
      return res.status(404).send({ success: false, message: 'Temple not found' });
    }

    if (!temple.pendingChanges) {
      return res.status(200).send({ success: false, message: 'No pending changes for this temple' });
    }

    res.status(200).send({ success: true, message: 'Pending changes retrieved successfully', data: temple.pendingChanges });
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
    }).limit(10); // Limit to 10 suggestions
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

    const temples = await Temple.find({ typeOfOrganization }).populate('createdBy').limit(limit);
    // Limit the number of documents returned per page

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







