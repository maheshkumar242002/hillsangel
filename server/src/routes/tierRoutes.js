import express from 'express';
import { getTiers, getTierByKey } from '../controllers/tierController.js';

const router = express.Router();

router.get('/', getTiers);
router.get('/:key', getTierByKey);

export default router;
