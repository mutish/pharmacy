import express from "express";
import { register, login, logout } from "../../controllers/auth.controller.js";
import authMiddleware from "../../middlewares/authMiddleware.js";
import roleMiddleware from "../../middlewares/roleMiddleware.js";

const router = express.Router();
// Public
router.post("/register", register);

router.post("/login", login);

router.post("/logout", logout);

// Example: protected route
router.get("/admin-dashboard", authMiddleware, roleMiddleware("admin"), (req, res) => {
  res.json({ message: "Welcome Admin 🚀" });
});


export default router;
