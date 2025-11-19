import express from 'express';
import { authorize, protectRoute } from "../middleware/protectRoute.js"
import upload from '../middleware/upload.middleware.js';
import { uploadPrescription, verifyPrescription } from '../controllers/prescription.controller.js';
import { getAllPrescriptions } from '../controllers/prescription.controller.js';

const router = express.Router();

// Apply protect middleware to all routes
router.use(protectRoute);

router.post("/upload", authorize('patient'), upload.single('file'), uploadPrescription);
router.post("/verify/:prescriptionId", authorize('pharmacist'), verifyPrescription);
router.get('/allprescriptions', authorize('pharmacist', 'admin'), getAllPrescriptions);

export default router;
