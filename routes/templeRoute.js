import express from 'express';
import {
  createTemple,
  getAllTemples,
  getTempleById,
  updateTempleById,
  deleteTempleById
} from '../controllers/templeController.js';
import { isAdmin, isSignin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Create a new temple
router.post('/create-temple', isSignin, isAdmin, createTemple);

// Get all temples
router.get('/get-temples', getAllTemples);

// Get a single temple by ID
router.get('/get-temple/:id', getTempleById);

// Update a temple by ID
router.put('/update-temple/:id',isSignin, isAdmin, updateTempleById);

// Delete a temple by ID
router.delete('/delete-temple/:id',isSignin, isAdmin, deleteTempleById);

export default router;
