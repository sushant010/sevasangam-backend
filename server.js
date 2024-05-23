import express from 'express'
import colors from 'colors'
import cors from 'cors'
import dotenv from 'dotenv'
import morgan from 'morgan'
import path from 'path'
import mongoConnect from './config/db.js'
import authRoute from './routes/authRoute.js'
import templeRoute from './routes/templeRoute.js'
import donationRoute from './routes/donationRoute.js'
// import categoryRoute from './routes/categoryRoute.js'
// import productRoute from './routes/productRoute.js'
import { fileURLToPath } from 'url'

// load all .env variables
dotenv.config();

// rest object
const app = express();

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));

// mongodb connect
mongoConnect();

const __filename = fileURLToPath(import.meta.url)

const __dirname = path.dirname(__filename)

// middleware

app.use(cors())
// use to send json data
app.use(express.json())
// use to get info about requests
app.use(morgan('dev'))



// app.use(express.static(path.join(__dirname, './client/build')));



const PORT = process.env.PORT || 8080;


// routes
app.use('/api/v1/auth', authRoute)

app.use('/api/v1/temple', templeRoute);

app.use('/api/v1/donation', donationRoute);

// app.use('/api/v1/category', categoryRoute)

// app.use('/api/v1/product', productRoute)




// app.use('*', function (req, res) {
//     const index = path.join(__dirname, './client/build/index.html')
//     res.sendFile(index);
// });


app.listen(PORT, () => {
    console.log(`App running on port ${PORT}`.bgCyan.white)
})