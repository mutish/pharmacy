import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";


dotenv.config();

const app = express();

//middleware
app.use(helmet());   // Security headers
app.use(cors({ origin: "*", credentials: true }));  // Cross-origin support
app.use(express.json());  // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));  // Parse URL-encoded bodies
app.use(morgan("dev"));  //Log http requests
app.use(cookieParser());  //handle cookies

//health route

app.get("/api/health", (req, res) => {
   res.json({status: "ok", message: "Backend is running"});
});

//placeholder routes

// import orderRoutes from "./routes/order.routes.js";
// import paymentRoutes from "./routes/payment.routes.js";

app.use("/api/auth", authRoutes);

// app.use("/api/orders", orderRoutes);
// app.use("/api/payments", paymentRoutes);

//Global error handler
app.use((err, req, res, next) => {
   console.error(err.stack);
   res.status(500).json({message: "Something went wrong on the server"});
});

export default app;