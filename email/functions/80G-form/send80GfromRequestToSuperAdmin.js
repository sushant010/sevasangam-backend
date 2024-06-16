//send80GformRequestToAdmin.js

import ejs from "ejs";
import fs from "fs";
import path from "path";
import transporter from "../../email.js";
import { configDotenv } from "dotenv";

configDotenv();

const send80GformRequestToSuperAdmin = async (
  backendUrl,
  donationId,
  requestedBy,
  templeId,
  templeName,
  paymentId,
  donationAmount,
  donationCurrency,
  donationDate,
  contactName,
  contactEmail,
  contactNo,
  adminName
) => {
  const templatePath = path.join(
    path.resolve(),
    "/email/templates/80G-form/formRequestToSuperAdmin.ejs"
  );

  const template = fs.readFileSync(templatePath, "utf-8");

  const mailOptions = {
    from: process.env.EMAIL_APP_USERNAME,
    to: process.env.BUSINESS_ADMIN_CONTACT_EMAIL,
    subject: "80G Form Request",
    html: ejs.render(template, {
      backendUrl: process.env.WEBSITE_URL,
      donationId: donationId,
      donationDate: new Date(donationDate * 1000).toDateString(),
      donationAmount: donationAmount,
      donationCurrency: donationCurrency,
      paymentId: paymentId,
      templeName: templeName,
      templeId: templeId,
      requestedBy: requestedBy,
      contactName: contactName,
      contactEmail: contactEmail,
      contactNo: contactNo,
      adminName: adminName,
    }),
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log(error);

    throw new Error("Error sending email");
  }
};

export default send80GformRequestToSuperAdmin;
