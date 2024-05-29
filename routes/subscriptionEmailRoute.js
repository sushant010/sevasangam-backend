
import { Router } from "express";
import {subscribe, getallSubscriptionEmails} from "./../controllers/subscriptionEmailController.js"
import { isSignin, isSuperAdmin } from "../middlewares/authMiddleware.js";

// import subscriptionEmailRouter from "../controllers/subscriptionEmailController.js";

const subscriptionEmailRoute = Router();

// subscriptionEmailRoute.use( subscriptionEmailRouter);

subscriptionEmailRoute.post("/subscribe", subscribe);

subscriptionEmailRoute.post("/getallSubscriptionEmails" , isSignin, isSuperAdmin, getallSubscriptionEmails)

export default subscriptionEmailRoute;

