import express from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Assume .env is in the project root (one level up from backend/)
const envPath = resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';

import authRoutes from './routes/auth.routes.js';
import messageRoutes from './routes/message.routes.js';
import prescriptionRoutes from './routes/prescription.routes.js';
import productRoutes from './routes/product.routes.js';
import cartRoutes from './routes/cart.routes.js';
import orderRoutes from './routes/order.routes.js';
import checkoutRoutes from './routes/checkout.routes.js';
import mpesaRoutes from './routes/mpesa.routes.js';


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

// Serve uploaded files (e.g., /uploads/prescriptions/...)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/prescription", prescriptionRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart",cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/mpesa",mpesaRoutes);


  
app.listen(PORT, () => {
    connectToMongoDB();
    console.log(`Server running on port ${PORT}`)
});