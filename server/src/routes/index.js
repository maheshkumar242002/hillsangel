import express from 'express';

import authRoutes from './authRoutes.js';
import packageRoutes from './packageRoutes.js';
import bookingRoutes from './bookingRoutes.js';
import enquiryRoutes from './enquiryRoutes.js';
import settingsRoutes from './settingsRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import customerRoutes from './customerRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import tierRoutes from './tierRoutes.js';
import galleryRoutes from './galleryRoutes.js';
import assetRoutes from './assetRoutes.js';
import gpsRoutes from './gpsRoutes.js';
import partnerTieupRoutes from './partnerTieupRoutes.js';
import vehicleRoutes from './vehicleRoutes.js';
import driverRoutes from './driverRoutes.js';
import destinationRoutes from './destinationRoutes.js';
import expenseRoutes from './expenseRoutes.js';
import uploadRoutes from '../common/routes/uploadRoutes.js';

const router = express.Router();

// Common upload endpoints (available at /api/upload and /api/common/upload)
router.use('/upload', uploadRoutes);
router.use('/common/upload', uploadRoutes);

// Mount all API resource sub-routers
router.use('/auth', authRoutes);
router.use('/packages', packageRoutes);
router.use('/bookings', bookingRoutes);
router.use('/enquiries', enquiryRoutes);
router.use('/settings', settingsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/customers', customerRoutes);
router.use('/categories', categoryRoutes);
router.use('/tiers', tierRoutes);
router.use('/gallery', galleryRoutes);
router.use('/assets', assetRoutes);
router.use('/gps', gpsRoutes);
router.use('/partners', partnerTieupRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/drivers', driverRoutes);
router.use('/destinations', destinationRoutes);
router.use('/expenses', expenseRoutes);

export default router;
