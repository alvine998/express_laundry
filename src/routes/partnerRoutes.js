const express = require('express');
const router = express.Router();
const {
  updateShopSettings,
  getPendingOrders,
  updateOrderStatus,
  updateOrderWeight,
  getWalletBalance,
  withdrawFunds
} = require('../controllers/partnerController');
const { authenticate, verifyRole } = require('../middleware/authMiddleware');

router.use(authenticate);
router.use(verifyRole('partner'));

// Shop Settings
router.patch('/shop/settings', updateShopSettings);

// Orders
router.get('/orders/pending', getPendingOrders);
router.patch('/orders/:id/status', updateOrderStatus);
router.patch('/orders/:id/weight', updateOrderWeight);

// Wallet
router.get('/wallet/balance', getWalletBalance);
router.post('/wallet/withdraw', withdrawFunds);

module.exports = router;
