import { Router } from "express";
import { createOrder, getOrders, getOrderById } from "../../controllers/order.controller.js";
import authMiddleware from "../../middlewares/authMiddleware.js";


const router = Router();

router.post("/new-order", authMiddleware, createOrder);
router.get("/allorders", authMiddleware, getOrders);
router.get("/order/:id", authMiddleware, getOrderById);

export default router;
