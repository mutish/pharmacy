import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import authRoutes from './routes/auth.routes.js';
import messageRoutes from './routes/message.routes.js';
import prescriptionRoutes from './routes/prescription.routes.js';
import productRoutes from './routes/product.routes.js';
import cartRoutes from './routes/cart.routes.js';
import orderRoutes from './routes/order.routes.js';
import checkoutRoutes from './routes/checkout.routes.js';


import connectToMongoDB from './config/connectToMongoDB.js';

const app = express();
const PORT = process.env.PORT || 5000;

dotenv.config();

// Enable CORS for your client (adjust origin as needed)
app.use(cors({
    origin: [
        'http://localhost:5500',
        'http://127.0.0.1:5500'
    ],
    credentials: true // Allow cookies to be sent
}));

app.use(express.json()); //parse incoming requests with JSON payloads.(from req.body)
app.use(cookieParser());

// Optionally serve static files (if you want to host client from backend)
// import path from 'path';
// app.use(express.static(path.join(process.cwd(), 'client', 'dist')));

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/prescription", prescriptionRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart",cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/checkout", checkoutRoutes);


  
app.listen(PORT, () => {
    connectToMongoDB();
    console.log(`Server running on port ${PORT}`)
});