import express from "express";
import { registerController, loginController, forgotPassword, allUsersController, deleteUserController, updateProfileController, googleLoginController } from '../controllers/authController.js'
import { isAdmin, isSignin, isSuperAdmin } from '../middlewares/authMiddleware.js'

const router = express.Router()


router.post('/register', registerController)

router.post('/login', loginController)

router.post('/forgot-password', forgotPassword)

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

// router.delete('/delete-user/:id', isSuperAdmin, deleteUserController)

router.delete('/delete-user/:id', deleteUserController)

router.put('/update', updateProfileController)

// Google Auth

router.post('/google-login', googleLoginController);



export default router;