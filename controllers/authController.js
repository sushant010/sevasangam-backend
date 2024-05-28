import userModel from '../models/userModel.js'
import dotenv from 'dotenv'
import { hashPassword, comparePassword } from '../helpers/authHelper.js'
import JWT from 'jsonwebtoken'
import axios from 'axios';
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt'


const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

dotenv.config();

export const registerController = async (req, res) => {
    try {
        const { name, email, password, phone, role } = req.body;

        if (!name || !email || !password || !phone) {
            return res.send({ error: 'Input field cannot be blank, Please fill required information' })
        }
        const existingUser = await userModel.findOne({ email });

        if (existingUser) {
            return res.send({ error: 'user already exists! Please login.' })
        }

        const hashedPassword = await hashPassword(password);
        const user = await new userModel({ name, email, password: hashedPassword, phone, role }).save();
        return res.status(201).send({ success: true, message: 'Your Account is created successfully!', user })

    } catch (error) {
        return res.status(500).send({ success: false, message: 'Oops! Registration failed!', error })
    }
}

export const loginController = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.send({ error: 'Please fill both the fields.' })
        }
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.send({ error: 'No user exists, please create one.' })
        }

        const checkComparePassword = await comparePassword(password, user.password);

        if (!checkComparePassword) {
            return res.send({ error: 'Wrong Credentials!' })
        }
        console.log(user)
        const token = JWT.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        return res.status(201).send({ success: true, message: 'Logged in Successfully', user, token })


    } catch (error) {
        return res.status(500).send({ success: false, message: 'Login failed!', error })
    }
}

// export const forgotPassword = async (req, res) => {
//     try {
//         const { email } = req.body;

//         if (!email) {
//             return res.send({ error: 'Please fill email.' })
//         }
//         const existingUser = await userModel.findOne({ email });

//         if (!existingUser) {
//             return res.send({ error: 'No such user exists, please Register!' })
//         }

//         const hashedPassword = await hashPassword(password);

//         const user = await userModel.findByIdAndUpdate(existingUser._id, { password: hashedPassword })
//         if (user) {

//             return res.status(201).send({ success: true, message: 'password updated successfully', user })
//         }

//     } catch (error) {

//         return res.status(500).send({ success: false, message: 'password change failed!', error })
//     }
// }




export const allUsersController = async (req, res) => {
    try {
        const users = await userModel.find({});
        if (!users) return res.send({ message: 'No users exists' })
        return res.status(200).send({ success: true, message: 'users fetched successfully', users })
    } catch (error) {
        return res.status(500).send({ success: false, message: 'internal error!', error })
    }
}


export const allTempleAdminsController = async (req, res) => {
    try {
        const users = await userModel.find({ role: 1, totalTempleCreated: { $gt: 0 } });
        if (!users) return res.send({ message: 'No users exists' })
        return res.status(200).send({ success: true, message: 'users fetched successfully', users })
    } catch (error) {
        return res.status(500).send({ success: false, message: 'internal error!', error })
    }
}

export const deleteUserController = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await userModel.findByIdAndDelete(id);

        if (category) {
            return res.status(201).send({ success: true, message: 'user deleted successfully!' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send({ error: 'Internal Server Error' });
    }
}

export const updateProfileController = async (req, res) => {
    try {
        const { name, password, phone } = req.body;
        const userId = req.params.id;

        // Find the user by ID
        const currentUser = await userModel.findById(userId);

        // If user not found, return error
        if (!currentUser) {
            return res.status(404).send({ success: false, message: 'User not found.' });
        }

        // Hash the password if provided
        const hashedPassword = password ? await hashPassword(password) : undefined;

        // Update user's information
        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            {
                name: name || currentUser.name,
                password: hashedPassword || currentUser.password,
                phone: phone || currentUser.phone
            },
            { new: true } // Return the updated document
        );

        // Respond with success message and updated user
        return res.status(200).send({ success: true, message: 'Profile updated successfully!', user: updatedUser });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ success: false, message: 'Oops! Profile update failed!', error: error.message });
    }
};



export const googleLoginController = async (req, res) => {
    try {
        const { name, email, picture, accessToken } = req.body;

        if (!name || !email || !accessToken) {
            return res.status(400).send({ error: 'Missing required fields' });
        }

        let user = await userModel.findOne({ email });

        if (!user) {
            // Register new user
            const password = 'defaultPassword123'; // Set a default password, or you can generate a random one
            const hashedPassword = await hashPassword(password);
            user = await new userModel({ name, email, password: hashedPassword, phone: '' }).save();
        }

        // Generate JWT token
        const token = JWT.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });


        return res.status(200).send({
            success: true,
            message: 'Logged in successfully with Google!',
            user,
            token,
        });
    } catch (error) {
        console.error('Google login error:', error);
        return res.status(500).send({ success: false, message: 'Google login failed', error });
    }
};


export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const oldUser = await userModel.findOne({ email });

        const sendLinkTo = email;

        if (!oldUser) {
            return res.status(400).send({ message: 'Missing required fields' });
        }

        const token = JWT.sign({ email: oldUser.email, id: oldUser._id }, process.env.JWT_SECRET, {
            expiresIn: "5m",
        });

        const link = `${process.env.API_URL}/api/v1/auth/reset-password/${oldUser._id}/${token}`;

        var transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_APP_USERNAME,
                pass: process.env.EMAIL_APP_PASSWORD,
            },
        });

        var mailOptions = {
            from: process.env.EMAIL_APP_USERNAME,
            to: sendLinkTo,
            subject: "Password Reset | Sevasangam",
            html: `
                <div style="font-family: 'Poppins', sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 10px;">
                    <h2 style="color: #ff395c; text-align: center;">Sevasangam Password Reset</h2>
                    <p>Hello,</p>
                    <p>You have requested to reset your password. Please click the button below to reset your password:</p>
                    <a href="${link}" style="display: inline-block; padding: 10px 20px; margin: 10px 0; font-size: 16px; color: white; background-color: #ff395c; border: none; border-radius: 5px; text-decoration: none;">Reset Password</a>
                    <p>If you did not request this password reset, please ignore this email or contact support if you have questions.</p>
                    <p>Thank you,</p>
                    <p>Sevasangam Team</p>
                    <hr />
                    <p style="font-size: 12px; color: #929292;">If you're having trouble clicking the password reset button, copy and paste the URL below into your web browser:</p>
                    <p style="font-size: 12px; color: #929292;">${link}</p>
                </div>
            `,
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log("Email sent: " + info.response);
            }
        });
        return res.status(200).send({ success: true, message: 'Email sent Successfully!' });

    } catch (error) {
        console.error('Forgot Password error:', error);
        return res.status(500).send({ success: false, message: 'Forgot Password error', error });
    }



}



export const resetPasswordVerify = async (req, res) => {
    const { id, token } = req.params;
    const oldUser = await userModel.findOne({ _id: id });
    if (!oldUser) {
        return res.json({ status: "User Not Exists!!" });
    }
    try {
        const verify = JWT.verify(token, process.env.JWT_SECRET);
        res.render("resetPassword", { email: verify.email, status: "Verified" });
    } catch (error) {
        console.log(error);
        res.send("Not Verified");
    }
}

export const resetPasswordComplete = async (req, res) => {
    const { id, token } = req.params;
    const { password } = req.body;

    const oldUser = await userModel.findOne({ _id: id });
    if (!oldUser) {
        return res.json({ status: "User Not Exists!!" });
    }

    try {
        const verify = JWT.verify(token, process.env.JWT_SECRET);
        const encryptedPassword = await bcrypt.hash(password, 10);
        await userModel.updateOne(
            {
                _id: id,
            },
            {
                $set: {
                    password: encryptedPassword,
                },
            }
        );

        alert("Password Reset Successfully!!")
        res.redirect(process.env.WEBSITE_URL);
    } catch (error) {
        console.log(error);
        res.json({ status: "Something Went Wrong" });
    }
}

