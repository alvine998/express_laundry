const express = require('express');
const router = express.Router();
const {
  getAdminDashboard,
  getPartnerDashboard,
  getCustomerDashboard
} = require('../controllers/dashboardController');
const { authenticate, verifyRole } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/admin', verifyRole('admin'), getAdminDashboard);
router.get('/partner', verifyRole('partner'), getPartnerDashboard);
router.get('/customer', verifyRole('customer'), getCustomerDashboard);

module.exports = router;
