import dotenv from "dotenv"
import connectDB from './db/index.js'
import { app } from "./app.js"

dotenv.config({
    path: './env'
})
connectDB()
.then(() => {
    app.on("error", (err) => {
        console.log("ERROR", err);
        throw err;     
    })
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running at PORT: ${process.env.PORT}`);
        
    })
})
.catch((err) => {
    console.log("MongoDB connection failed...!", err);
    
})
// First approach to connect app to DB
/*
import express from 'express'
const app = express()
// iife
( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error) => {
            console.log("error", error);     // when the database is connected but due to some reasons the express app is not able to talk to the database. So the listeners are used to throw error 
            throw error; 
        }) 

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`);
        })
    } catch (error) {
        console.error("ERROR: ", error)
        throw error
    }
})()

*/