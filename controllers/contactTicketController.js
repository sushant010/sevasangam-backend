import { Router } from "express";

import adminContactFormEmail from "../email/functions/adminContactFormEmail.js";
import contactTicketModel from "../models/contactTicketModel.js";
import { isSignin, isSuperAdmin } from "../middlewares/authMiddleware.js";

const contactFormRouter = Router();

contactFormRouter.post("/", async (req, res) => {
  if (!req.body) {
    return res.status(404).json({ message: "No data provided" });
  }
  try {
    const { tittle, email, message } = req.body;
    const contactTicket = new contactTicketModel({
      tittle,
      email,
      message,
      status: "open",
    });
    await contactTicket.save();
    await adminContactFormEmail(email, tittle, message);
    res.status(201).json({ message: "Contact ticket created" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error creating contact ticket" });
  }
});

//get all contact tickets

contactFormRouter.post(
  "/getallContactTickets",
  isSignin,
  isSuperAdmin,
  async (req, res) => {
    try {
      const contactTickets = await contactTicketModel.find();
      res.status(200).json(contactTickets);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Error getting contact tickets" });
    }
  }
);

export default contactFormRouter;
