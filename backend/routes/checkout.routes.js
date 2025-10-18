// routes/checkout.routes.js
import express from "express";
import {
  createCheckout,
  getAllCheckouts,
  getCheckoutById,
} from "../controllers/checkout.controller.js";

import { protectRoute } from '../middleware/protectRoute.js';

const router = express.Router();
router.use(protectRoute);

// Create a new checkout (before payment)
router.post("/new", createCheckout);

// Get all checkouts
router.get("/", getAllCheckouts);

// Get a specific checkout
router.get("/:id", getCheckoutById);

// // Delete a checkout
// router.delete("/:id", deleteCheckout);

export default router;


