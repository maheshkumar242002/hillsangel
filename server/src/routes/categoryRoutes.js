import express from 'express';
import { getCategories, getCategoryByKey } from '../controllers/categoryController.js';

const router = express.Router();

router.get('/', getCategories);
router.get('/:key', getCategoryByKey);

export default router;
