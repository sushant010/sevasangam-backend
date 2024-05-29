import nodeMailer from 'nodemailer';
import dotenv from 'dotenv';    
dotenv.config();


const transporter = nodeMailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_APP_USERNAME,
        pass: process.env.EMAIL_APP_PASSWORD
    }

});

export default transporter;    
