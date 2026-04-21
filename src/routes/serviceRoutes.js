const express = require('express');
const router = express.Router();
const {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService
} = require('../controllers/serviceController');
const { authenticate, verifyRole } = require('../middleware/authMiddleware');

// Public
router.get('/', getServices);
router.get('/:id', getServiceById);

// Partner only
router.post('/', authenticate, verifyRole('partner'), createService);
router.patch('/:id', authenticate, verifyRole('partner'), updateService);
router.delete('/:id', authenticate, verifyRole('partner'), deleteService);

module.exports = router;
