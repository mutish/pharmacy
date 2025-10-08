import express from 'express';
import { protectRoute } from '../middleware/protectRoute.js';
import { addToCart, clearCart, getUserCart, removeCartItem, updateCartItem } from '../controllers/cart.controller.js';

const router = express.Router();
router.use(protectRoute);

router.post("/addcart",addToCart);
router.get("/getCart/:userId",getUserCart);
router.put("/updatecart/:cartItemId",updateCartItem);
router.delete("/deletecart/:cartItemId",removeCartItem);
router.delete("/user/:userId",clearCart);

export default router;