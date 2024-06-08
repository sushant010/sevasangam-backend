import adminContactFormEmail from "../email/functions/adminContactFormEmail.js";
import contactTicketModel from "../models/contactTicketModel.js";



export const createContactTicket = async (req, res) => {
  if (!req.body) {
    return res.status(404).json({ message: "No data provided" });
  }
  try {
    const { title, email, message } = req.body;
    const contactTicket = new contactTicketModel({
      title,
      email,
      message,
      status: "open",
    });
    await contactTicket.save();
    const url = `${process.env.WEBSITE_URL}/superadmin/contact-ticket`;
    await adminContactFormEmail(email, title, message, url);
    res.status(201).json({ message: "Contact ticket created" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error creating contact ticket" });
  }


}


export const getAllContactTickets = async (req, res) => {
  try {
    const contactTickets = await contactTicketModel.find();
    res.status(200).json(contactTickets);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error getting contact tickets" });
  }

}


