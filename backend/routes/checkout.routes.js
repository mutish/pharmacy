import express from 'express';
import { initiateMpesaPayment, mpesaCallback, getAllCheckouts } from '../controllers/checkout.controller.js';
import { protectRoute } from '../middleware/protectRoute.js';

const router = express.Router();
router.use(protectRoute);

router.post('/pay', initiateMpesaPayment);
router.post('/mpesa/callback', mpesaCallback);
router.get('/allcheckouts', getAllCheckouts);

export default router;
