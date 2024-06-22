import ejs from "ejs";
import fs from "fs";
import path from "path";
import transporter from "../email.js";
import { configDotenv } from "dotenv";

configDotenv();

const sendDonationAcknowledgementToDonateUser = async (userEmail, name, razorpay_payment_id, templeName, donationAmount, currency, method, donationDate) => {
    const templatePath = path.join(
        path.resolve(),
        "/email/templates/sendDonationAcknowledgementToDonateUserTemplate.ejs"
    );

    const template = fs.readFileSync(templatePath, "utf-8");

    const mailOptions = {
        from: process.env.EMAIL_APP_USERNAME,
        to: userEmail,
        subject: "Thank you for your donation! | SevaSangam",
        html: ejs.render(template, {
            name: name,
            razorpay_payment_id: razorpay_payment_id,
            templeName: templeName,
            donationAmount: donationAmount,
            donationCurrency: currency,
            donationMethod: method,
            donationDate: new Date(donationDate * 1000).toDateString(),
        }),
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.log(error);

        throw new Error("Error sending email");
    }
};

export default sendDonationAcknowledgementToDonateUser;
