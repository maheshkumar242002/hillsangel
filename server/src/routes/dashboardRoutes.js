import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { protectAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', protectAdmin, getDashboardStats);

export default router;
