import express from "express";
import {
  login,
  signup,
  logout,
  getUserProfile,
  updateUserProfile,
  deleteUserAccount,
  getAllUsers
} from "../controllers/auth.controller.js";

import { protectRoute, authorize } from "../middleware/protectRoute.js";

const router = express.Router();

// Auth routes
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

// Profile management routes (for logged-in users)
router.get("/me", protectRoute, getUserProfile);
router.patch("/me", protectRoute, updateUserProfile);
router.delete("/me", protectRoute, deleteUserAccount);

// Admin routes
router.get("/allusers", protectRoute, authorize("admin"), getAllUsers);

// New: Admin-only user creation (use credentials/cookie)
import { createUserByAdmin } from "../controllers/auth.controller.js"; // add import at top if needed
router.post("/create", protectRoute, authorize("admin"), createUserByAdmin);

export default router;
