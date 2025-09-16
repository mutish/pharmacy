import express from "express";
import { addToCart, getCart, removeFromCart } from "../../controllers/cart.controller.js";
import  authMiddleware  from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, addToCart);
router.get("/", authMiddleware, getCart);
router.delete("/:productId", authMiddleware, removeFromCart);

export default router;
