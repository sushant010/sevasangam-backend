import { Router } from "express";
import subscriptionEmailModel from "../models/subscriptionEmailModel.js";
import { isSignin, isSuperAdmin } from "../middlewares/authMiddleware.js";

const subscriptionEmailRouter = Router();

subscriptionEmailRouter.post("/subscribe", async (req, res) => {
  if (!req.body) {
    return res.status(404).json({ message: "No data provided" });
  }
  try {
    const { email } = req.body;
    const existingEmail = await subscriptionEmailModel.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already subscribed" });
    }
    const subscriptionEmail = new subscriptionEmailModel({
      email,
    });
    await subscriptionEmail.save();
    res.status(201).json({ message: "Email subscribed" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error subscribing email" });
  }
});

subscriptionEmailRouter.post(
  "/getallSubscriptionEmails",
  isSignin,
  isSuperAdmin,
  async (req, res) => {
    try {
      const subscriptionEmails = await subscriptionEmailModel.find();
      res.status(200).json(subscriptionEmails);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Error getting subscription emails" });
    }
  }
);

export default subscriptionEmailRouter;
