import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN, 
    credentials: true
})) // app.use is used for middlewares and configs

app.use(express.json({limit: "20kb"})) // to validate json requests
app.use(express.urlencoded({extended: true, limit: "20kb"})) // url encoder validator [ex: - %20]
app.use(express.static("public")) // to store images and favicon
app.use(cookieParser()) // to perform CRUD ops in user's cookies

// routes import
import userRouter from './routes/user.routes.js'

// routes declaration
app.use("/api/v1/users", userRouter) // http://localhost:8000/api/v1/users + /register


export { app } 