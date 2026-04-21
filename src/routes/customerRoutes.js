const express = require('express');
const router = express.Router();
const {
  getProfile,
  getAddresses,
  addAddress,
  updateAddress,
  placeOrder,
  getOrderHistory
} = require('../controllers/customerController');
const { authenticate, verifyRole } = require('../middleware/authMiddleware');

router.use(authenticate);

// Profile
router.get('/profile', getProfile);

// Specific to customer
router.use(verifyRole('customer'));

// Addresses
router.get('/addresses', getAddresses);
router.post('/addresses', addAddress);
router.patch('/addresses/:id', updateAddress);

// Orders
router.post('/orders', placeOrder);
router.get('/orders/history', getOrderHistory);

module.exports = router;
