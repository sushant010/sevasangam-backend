import JWT from "jsonwebtoken";
import dotenv from "dotenv";
import userModel from "../models/userModel.js";

dotenv.config();

// Is Signed In Middleware
export const isSignin = async (req, res, next) => {
  try {
    // Get token from authorization header
    if (!req.headers.authorization) {
      return res.status(401).send({
        success: false,
        message: "Unauthorized Access! Authorization token not provided!",
      });
    }
    const token = req.headers.authorization.split(" ")[1];
    
    // Decode token and check expiration
    const decode = JWT.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err && err.name === "TokenExpiredError") {
        return res.status(401).send({
          success: false,
          message: "Unauthorized Access! Token has expired.",
        });
      }
      if (err) {
        return res.status(401).send({
          success: false,
          message: "Unauthorized Access! Invalid token.",
        });
      }
      return decoded;
    });

    if (!decode) {
      return res.status(401).send({
        success: false,
        message: "Unauthorized Access! Token doesn't qualify.",
      });
    }

    req.user = decode; // Attach decoded user information to the request
    return next();
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Server Error! Failed to authenticate token.",
    });
  }
};

// Is Admin Middleware
export const isAdmin = async (req, res, next) => {
  try {
    const existingUser = await userModel.findById(req.user._id);
    if (!existingUser || existingUser.role !== 1) {
      return res.status(403).send({
        success: false,
        message: "Unauthorized Access! Admin privileges required.",
      });
    }
    return next();
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Server Error! Failed to verify admin access.",
    });
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


