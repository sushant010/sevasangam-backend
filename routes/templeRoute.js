import express from 'express';
import {
  createTemple,
  getAllTemples,
  getTempleById,
  updateTempleById,
  deleteTempleById,
  getAllTemplesByAdmin,
  getFilteredTemples,
  verifyTemple,
  rejectTemple,
  reviewPendingChanges,
  getSearchSuggestionTempleName,
  getUnverifiedNewlyCreatedTemples,
  getUnverifiedUpdatedByAdminTemples,
  getSimilarTemples,
  getTrendingTemples,

  addTrendingTemple,
  removeTrendingTemple,
} from '../controllers/templeController.js';
import { isAdmin, isSignin } from '../middlewares/authMiddleware.js';
import upload from '../config/multer.js';


const router = express.Router();

// Create a new temple
router.post('/create-temple', upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'bannerImage', maxCount: 1 },
  { name: 'otherImages', maxCount: 5 },
]), createTemple);

// Update a temple by ID
router.put('/update-temple/:id', updateTempleById);

// Get all temples
router.get('/get-temples', getAllTemples);

// Get a single temple by ID
router.get('/get-temple/:id', getTempleById);
// router.get('/get-temple/:name', getTempleByName);

router.get('/unverified-newly-created-temples', getUnverifiedNewlyCreatedTemples);
router.get('/unverified-updated-by-admin-temples', getUnverifiedUpdatedByAdminTemples);

// Delete a temple by ID
router.delete('/delete-temple/:id', deleteTempleById);

// get all temples by an admin
router.post('/get-temples-by-admin', getAllTemplesByAdmin);

router.post('/filter-temples', getFilteredTemples)

router.post('/verify-temple/:id', verifyTemple)

router.post('/reject-temple', rejectTemple)

router.get('/pending-changes/:id', reviewPendingChanges)

router.post('/fetch-similar-temples/:id', getSimilarTemples)

router.get('/fetch-trending-temples', getTrendingTemples)

router.post('/add-trending-temple/:id', addTrendingTemple)


router.delete('/remove-trending-temple/:id', removeTrendingTemple)

// router.post('/img-upload', upload.single('image'), uploadImage)

// get all temples by an admin for a timerange
// router.post('/get-temples-by-admin-with-timerange', getAllTemplesByAdminForTimerange);


router.get('/search-temple-suggestions', getSearchSuggestionTempleName)


export default router;
