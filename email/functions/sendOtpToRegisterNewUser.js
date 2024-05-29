import ejs from "ejs";
import fs from "fs";
import path from "path";
import transporter from "../email.js";
import { configDotenv } from "dotenv";

configDotenv();

const sendOtpToRegisterNewUser = async (email, otp) => {
  const templatePath = path.join(
    path.resolve(),
    "/email/templates/sendOtpToRegisterNewUserTemplate.ejs"
  );

  const template = fs.readFileSync(templatePath, "utf-8");

  const mailOptions = {
    from: process.env.EMAIL_APP_USERNAME,
    to: email,
    subject: "OTP to Register New User",
    html: ejs.render(template, { otp }),
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log(error);

    throw new Error("Error sending email");
  }
};

export default sendOtpToRegisterNewUser;
