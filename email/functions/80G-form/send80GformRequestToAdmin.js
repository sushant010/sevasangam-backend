//send80GformRequestToAdmin.js

import ejs, { name } from "ejs";
import fs from "fs";
import path from "path";
import transporter from "../../email.js";
import { configDotenv } from "dotenv";

configDotenv();


const send80GformRequestToAdmin = async (adminEmail,email, adminName, donationAmount,donationDate,templeName,templeId, donationCurrency,name, paymentId) => {
    const templatePath = path.join(
        path.resolve(),
        "/email/templates/80G-form/formRequestToAdmin.ejs"
      );

    //   console.log("name", name)

      const template = fs.readFileSync(templatePath, "utf-8");

        const mailOptions = {
            from: process.env.EMAIL_APP_USERNAME,
            to: adminEmail,
            subject: "80G Form Request",
            html: ejs.render(template, { 
                adminName: adminName,
                email: email,
                donationAmount: donationAmount,
                backendUrl: process.env.WEBSITE_URL,
                donationDate: new Date(donationDate * 1000).toDateString(),
                templeName: templeName,
                templeId: templeId,
                donationCurrency: donationCurrency,
                name: name,
                paymentId: paymentId
             }),
        };

        try {
            await transporter.sendMail(mailOptions);
        } catch (error) {
            console.log(error);

            throw new Error("Error sending email");
        }
}

export default send80GformRequestToAdmin;