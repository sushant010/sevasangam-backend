import JWT from "jsonwebtoken";
import dotenv from "dotenv";
import userModel from "../models/userModel.js";

dotenv.config();

export const isSignin = async (req, res, next) => {
  try {
    // get token from authorization header
    if (!req.headers.authorization) {
      return res
        .status(401)
        .send({ success: false, message: "Unauthorised Access! Not getting Authorization token!" });
    }
    const token = req.headers.authorization.split(" ")[1];
    const decode = JWT.verify(token, process.env.JWT_SECRET);
    if (!decode) {
      return res
        .status(401)
        .send({ success: false, message: "Unauthorised Access! Token doesn't qualify" });
    }
    req.user = decode;
    return next();
  } catch (error) {
    console.log(error);
  }
};

// Is Admin
export const isAdmin = async (req, res, next) => {
  try {
    const existingUser = await userModel.findById(req.user._id);
    if (existingUser.role !== 1) {
      return res
        .status(201)
        .send({ success: false, message: "Unauthorised Access!" });
    } else {
      return next();
    }
  } catch (error) {
    console.log(error);
  }
};

// is superAdmin

export const isSuperAdmin = async (req, res, next) => {
  try {
    const existingUser = await userModel.findById(req.user._id);
    if (existingUser.role !== 2) {
      return res
        .status(201)
        .send({ success: false, message: "Unauthorised Access! Not a Superadmin", id: existingUser.role });
    } else {
      return next();
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ success: false, message: "Internal Server Error" });
  }
};


