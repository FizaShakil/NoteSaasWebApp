import express from "express";
import cors from 'cors'
import cookieParser from'cookie-parser'
import {ApiError} from './utils/ApiError.js'
import {ApiResponse} from './utils/ApiResponse.js'
import userRouter from "./routes/user.router.js";
import prisma from './config/prisma.js'
import requestLogger from './middlewares/requestLogger.middleware.js'
import errorHandler from './middlewares/errorHandler.middleware.js'
import notesRouter from "./routes/notes.router.js";

const app = express();

// Request logging middleware (should be first)
app.use(requestLogger)

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({
    limit: '16kb'
}));
app.use(express.urlencoded({
    extended: true,
    limit: '16kb'
}))
app.use(express.static("public"))

app.use(cookieParser())

// Test route to verify database connection
app.get('/test', async (req, res, next) => {
    try {
        // Test database connection using the configured prisma instance
        await prisma.$connect()
        await prisma.$disconnect()
        
        res.json(new ApiResponse(200, {
            database: 'Connected to PostgreSQL via Prisma'
        }, 'Server and database connection working!'))
    } catch (error) {
        next(new ApiError(500, 'Database connection failed'))
    }
})

app.use("/api/v1/users" , userRouter)
app.use("/api/v1/notes", notesRouter)

// Global error handling middleware (must be last)
app.use(errorHandler)

export default app;
