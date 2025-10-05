import express from 'express';
import protectRoute from "../middleware/protectRoute.js"
import upload from '../middleware/upload.middleware.js';
import { uploadPrescription } from '../controllers/prescription.controller.js';

const router = express.Router();

// Apply protect middleware to all routes
router.use(protectRoute);

// Allow both patients and pharmacists to upload prescriptions
router.post(
    "/upload",
    //authorize('patient', 'pharmacist'),
    upload.single('file'),
    uploadPrescription
);

export default router;
