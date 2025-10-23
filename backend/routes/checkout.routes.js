// routes/checkout.routes.js
import express from "express";
import {
  createCheckout,
  getAllCheckouts,
  getCheckoutById,
  getMpesaTransactions,
} from "../controllers/checkout.controller.js";

import { protectRoute, authorize } from '../middleware/protectRoute.js';

const router = express.Router();
router.use(protectRoute);

// Create a new checkout (before payment)
router.post("/new", createCheckout);

// Get all checkouts
router.get("/", getAllCheckouts);

// New: admin MPESA transactions endpoint (admins only)
router.get("/mpesa", authorize("admin"), getMpesaTransactions);

// Get a specific checkout
router.get("/:id", getCheckoutById);

// // Delete a checkout
// router.delete("/:id", deleteCheckout);

export default router;


