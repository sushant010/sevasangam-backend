import express from "express";
import { registerController, loginController, forgotPassword, allUsersController, deleteUserController, updateProfileController, googleLoginController, allTempleAdminsController, resetPasswordVerify, resetPasswordComplete, sendOtpToRegisterNewUserController, totalDonationCollectedByAdmin, updateProfilePictureController } from '../controllers/authController.js'
import { isAdmin, isSignin, isSuperAdmin } from '../middlewares/authMiddleware.js'
import upload from '../config/authMulter.js';

const router = express.Router()

router.post('/otp-to-register', sendOtpToRegisterNewUserController)

router.post('/register', upload.fields([
    { name: 'avatar', maxCount: 1 },
]), registerController)

router.post('/login', loginController)

router.post('/forgot-password', forgotPassword)

router.get('/reset-password/:id/:token', resetPasswordVerify)

router.post('/reset-password/:id/:token', resetPasswordComplete)

router.get('/user-auth', isSignin, (req, res) => {
    res.status(201).send({ ok: true });
})

router.get('/admin-auth', isSignin, isAdmin, (req, res) => {
    res.status(201).send({ ok: true });
})
router.get('/superadmin-auth', isSignin, isSuperAdmin, (req, res) => {
    res.status(201).send({ ok: true });
})

router.get('/all-user', allUsersController)


router.get('/all-temple-admin', allTempleAdminsController)

router.get('/total-donation-by-admin/:id', totalDonationCollectedByAdmin)

// router.delete('/delete-user/:id', isSuperAdmin, deleteUserController)

router.delete('/delete-user/:id', deleteUserController)

router.put('/update/:id', upload.fields([
    { name: 'avatar', maxCount: 1 },
]), updateProfileController)


router.put('/update-profile-picture/:id', updateProfilePictureController)


// Google Auth

router.post('/google-login', googleLoginController);



export default router;