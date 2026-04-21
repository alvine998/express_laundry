const express = require('express');
const router = express.Router();
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');
const { authenticate, verifyRole } = require('../middleware/authMiddleware');

// Public access
router.get('/', getCategories);

// Admin only access
router.post('/', authenticate, verifyRole('admin'), createCategory);
router.put('/:id', authenticate, verifyRole('admin'), updateCategory);
router.delete('/:id', authenticate, verifyRole('admin'), deleteCategory);

module.exports = router;
