import express from 'express';
import {
  getExpenses,
  getExpenseStats,
  createExpense,
  updateExpense,
  reimburseExpense,
  deleteExpense,
} from '../controllers/expenseController.js';
import { authenticate, protectAdmin } from '../middleware/auth.js';
import { upload, processUploadedFile } from '../middleware/upload.js';

const router = express.Router();

// Stats route
router.get('/stats', authenticate, getExpenseStats);

// Main CRUD routes
router.route('/')
  .get(authenticate, getExpenses)
  .post(authenticate, createExpense);

router.route('/:id')
  .put(authenticate, updateExpense)
  .delete(authenticate, deleteExpense);

router.patch('/:id/reimburse', authenticate, reimburseExpense);

// Receipt upload endpoint
router.post('/upload-receipt', authenticate, upload.single('receipt'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No receipt file provided',
      });
    }

    const fileUrl = await processUploadedFile(req.file, req);

    res.status(200).json({
      success: true,
      fileUrl,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

