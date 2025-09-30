import { Router } from 'express';
import { 
    createOrder, 
    getOrder, 
    getUserOrders, 
    updateOrderStatus,
    processWebhook
} from '../controllers/order.controller.js';
import { mpesaCallback } from '../controllers/order.controller.js';
import { 
    validateCreateOrder, 
    validateUpdateStatus, 
    validateOrderQuery, 
    validateOrderId,
    validateRequest 
} from '../middlewares/validateRequest.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import roleMiddleware from '../middlewares/roleMiddleware.js';

const router = Router();

// Webhook endpoint (no auth required)
router.post('/webhook', processWebhook);

// Protected routes (require authentication)
router.use(authMiddleware);

// Create a new order
router.post(
    '/',
    [...validateCreateOrder, validateRequest],
    createOrder
);

// Get user's orders with optional filtering
router.get(
    '/',
    [...validateOrderQuery, validateRequest],
    getUserOrders
);

// Get order by ID
router.get(
    '/:id',
    [...validateOrderId, validateRequest],
    getOrder
);

// Update order status (admin only)
router.put(
    '/:id/status',
    roleMiddleware(['admin']),
    [...validateUpdateStatus, validateRequest],
    updateOrderStatus
);


export default router;
