import contactFormRouter from "../controllers/contactTicketController.js";

import { Router } from "express";

const contactRoute = Router();

contactRoute.use("/contact-form", contactFormRouter);

export default contactRoute;
