import express from 'express';
import {
  createTemple,
  getAllTemples,
  getTempleById,
  updateTempleById,
  deleteTempleById,
  getAllTemplesByAdmin,
  getAllTemplesByAdminForTimerange,
  getUnverifiedTemples
} from '../controllers/templeController.js';
import { isAdmin, isSignin } from '../middlewares/authMiddleware.js';
import upload from '../helpers/upload.js';

const router = express.Router();

// Create a new temple
router.post('/create-temple', upload, createTemple);

// Update a temple by ID
router.put('/update-temple/:id', upload, updateTempleById);

// Get all temples
router.get('/get-temples', getAllTemples);

// Get a single temple by ID
router.get('/get-temple/:id', getTempleById);

router.get('/unverified-temples', getUnverifiedTemples);

// Delete a temple by ID
router.delete('/delete-temple/:id', deleteTempleById);

// get all temples by an admin
router.post('/get-temples-by-admin', getAllTemplesByAdmin);

// get all temples by an admin for a timerange
router.post('/get-temples-by-admin-with-timerange', getAllTemplesByAdminForTimerange);




export default router;
