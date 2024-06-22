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
  getAllVerifiedTemples,
  searchTempleByName,
  getTempleCreators,
  getAllStatesOfTemples,
  getAllCitiesOfTemples,
  getAllImages,
} from '../controllers/templeController.js';
import { isAdmin, isSignin } from '../middlewares/authMiddleware.js';
import upload from '../config/multer.js';


const router = express.Router();

// Create a new temple
router.post('/create-temple', createTemple);

// Update a temple by ID
router.put('/update-temple/:id', updateTempleById);

// Get all temples
router.get('/get-temples', getAllTemples);
router.get('/search-temple-by-name', searchTempleByName);

router.get('/get-verified-temples', getAllVerifiedTemples);

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

router.get('/get-temple-creators', getTempleCreators)

router.post('/verify-temple/:id', verifyTemple)

router.post('/reject-temple', rejectTemple)

router.get('/pending-changes/:id', reviewPendingChanges)

router.post('/fetch-similar-temples/:id', getSimilarTemples)

router.get('/fetch-trending-temples', getTrendingTemples)

router.post('/add-trending-temple/:id', addTrendingTemple)

router.delete('/remove-trending-temple/:id', removeTrendingTemple)

router.get('/search-temple-suggestions', getSearchSuggestionTempleName)

router.get('/get-states-of-temples', getAllStatesOfTemples)


router.get('/get-cities-of-temples', getAllCitiesOfTemples)

router.get('/get-images-of-temples', getAllImages)

export default router;
