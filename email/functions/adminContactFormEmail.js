import ejs from "ejs";
import fs from "fs";
import path from "path";
import transporter from "../email.js";
import { configDotenv } from "dotenv";

configDotenv();

const adminContactFormEmail = async (email, tittle, message) => {
  const templatePath = path.join(
    path.resolve(),
    "/email/templates/contactFormEmailTemplate.ejs"
  );
  const template = fs.readFileSync(templatePath, "utf-8");

  const mailOptions = {
    from: process.env.EMAIL_APP_USERNAME,
    to: process.env.BUSINESS_ADMIN_CONTACT_EMAIL,
    subject: tittle,
    html: ejs.render(template, { tittle, email, message }),
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log(error);

    throw new Error("Error sending email");
  }
};

export default adminContactFormEmail;
