import express from "express";
import {
  login,
  signup,
  logout,
  getUserProfile,
  updateUserProfile,
  deleteUserAccount
} from "../controllers/auth.controller.js";

import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

// Auth routes
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

// Profile management routes (for logged-in users)
router.get("/me", protectRoute, getUserProfile);
router.patch("/me", protectRoute, updateUserProfile);
router.delete("/me", protectRoute, deleteUserAccount);

export default router;






// import express from 'express';
// import { login, signup, logout, getAllUsers } from '../controllers/auth.controller.js';
// import { protectRoute , authorize}  from '../middleware/protectRoute.js';

// const router = express.Router();

// router.post("/signup", signup);
// router.post("/login", login);
// router.post("/logout", logout);
// // Only admin can get all users
// router.get("/allusers", protectRoute, authorize('admin'), getAllUsers);

// //profile management
// router.get("/me", protect, getUserProfile);
// router.patch("/me", protect, updateUserProfile);
// router.delete("/me", protect, deleteUserAccount);

// export default router;
