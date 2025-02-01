import mongoose, { mongo } from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`) 
        console.log(`\n MongoDB connected .. DB HOST: ${connectionInstance.connection.host}`); // to know in which host I'm getting connected
    } catch (error) {
        console.log("MONGODB CONNECTION ERROR: ", error);
        process.exit(1) // to exit the process
    }
}

export default connectDB