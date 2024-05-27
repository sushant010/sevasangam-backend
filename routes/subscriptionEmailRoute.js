
import { Router } from "express";

import subscriptionEmailRouter from "../controllers/subscriptionEmailController.js";

const subscriptionEmailRoute = Router();

subscriptionEmailRoute.use( subscriptionEmailRouter);

export default subscriptionEmailRoute;

