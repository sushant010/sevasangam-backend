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
    const { email, title, message, status } = req.body;

    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.body.page) || 1;

    Object.keys(req.body).forEach(key => req.body[key] === '' && delete req.body[key]);

    let query = {};

    if (email) query.email = { $regex: email, $options: 'i' };
    if (title) query.title = { $regex: title, $options: 'i' };
    if (message) query.message = { $regex: message, $options: 'i' };
    if (status) query.status = { $regex: status, $options: 'i' };

    const contactTickets = await contactTicketModel.find({ ...query }).skip((page - 1) * limit).limit(limit).sort({ createdAt: -1 });
    res.status(200).send({ success: true, message: "Contact ticket fetched", contactTickets });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error getting contact tickets" });
  }

}

export const updateContactTicketStatus = async (req, res) => {
  try {
    const { id, status } = req.body;
    const contactTicket = await contactTicketModel.findByIdAndUpdate(id, { status });
    res.status(200).send({ success: true, message: "Contact ticket status updated", contactTicket });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Error getting contact tickets" });
  }

}


