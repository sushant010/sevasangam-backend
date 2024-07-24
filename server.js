import express from 'express'
import colors from 'colors'
import cors from 'cors'
import dotenv from 'dotenv'
import morgan from 'morgan'
import path from 'path'
import mongoConnect from './config/db.js'
import authRoute from './routes/authRoute.js'
import templeRoute from './routes/templeRoute.js'
import eventRoute from './routes/eventRoute.js'
import donationRoute from './routes/donationRoute.js'
import subscriptionRoute from './routes/subscriptionRoute.js'
import contactRoute from './routes/contactRoute.js'
import subscriptionEmailRoute from './routes/subscriptionEmailRoute.js'
// import categoryRoute from './routes/categoryRoute.js'
// import productRoute from './routes/productRoute.js'
import { fileURLToPath } from 'url'
import bodyParser from 'body-parser'

// load all .env variables
dotenv.config();

// rest object
const app = express();
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));



// mongodb connect
mongoConnect();

// const __filename = fileURLToPath(import.meta.url)

// const __dirname = path.dirname(__filename)

const __dirname = path.dirname("");
const buildPath = path.join(__dirname, '../sevasangam-frontend/build');
app.use(express.static(buildPath));

// middleware

app.use(cors())

// app.use(cors({
//     origin: 'https://sevasangam.com',
//     methods: 'GET,POST,PUT,DELETE',
//     allowedHeaders: 'Content-Type,Authorization'
// }));

// use to send json data
app.use(express.json())
// use to get info about requests
app.use(morgan('dev'))



// app.use(express.static(path.join(__dirname, './client/build')));



const PORT = process.env.PORT || 8080;



// routes
app.get('/api/v1/health', (req, res) => {
    res.status(200).send('OK');
});

app.use('/api/v1/auth', authRoute)

app.use('/api/v1/temple', templeRoute);

app.use('/api/v1/donation', donationRoute);

app.use('/api/v1/subscription', subscriptionRoute);

app.use('/api/v1/contact', contactRoute)

app.use('/api/v1/temple/event', eventRoute)

app.use('/api/v1/subscriptionEmail', subscriptionEmailRoute)


app.listen(PORT, () => {
    console.log(`App running on port ${PORT}`.bgCyan.white)
})