import express from 'express';
import { login, signup, logout, getAllUsers } from '../controllers/auth.controller.js';
import { get } from 'mongoose';

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/allusers", getAllUsers);

export default router;
