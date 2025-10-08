import express from "express";
import { cancelOrder, createOrder, getOrdersByUser, getSingleOrder, updateOrderStatus } from "../controllers/order.contoller.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();
router.use(protectRoute);

router.post("/new", createOrder);
router.get("/user/:userId", getOrdersByUser);
router.get("/:orderId", getSingleOrder);
router.put("/:orderId", updateOrderStatus);
router.put("/:orderId/cancel", cancelOrder);


export default router;