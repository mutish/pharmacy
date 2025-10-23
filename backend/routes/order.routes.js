import express from "express";
import { cancelOrder, createOrder, getAllOrders, getOrdersByUser, getSingleOrder, updateOrderStatus, requestCancelOrder } from "../controllers/order.contoller.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

// New public route: users can request cancellation by providing orderId and their email
router.post("/request-cancel", requestCancelOrder);

router.use(protectRoute);

router.post("/new", createOrder);
router.get("/allorders", getAllOrders);
router.get("/user/:userId", getOrdersByUser);
router.get("/:orderId", getSingleOrder);
router.put("/:orderId", updateOrderStatus);
router.put("/:orderId/cancel", cancelOrder);

export default router;