import mongoose from 'mongoose'
import colors from 'colors'
import dotenv from 'dotenv'

dotenv.config()

const mongoConnect = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log(`connected with mongodb`.bgYellow)
    } catch (error) {
        console.log(error)
    }
}

export default mongoConnect;