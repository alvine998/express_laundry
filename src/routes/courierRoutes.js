const express = require('express');
const router = express.Router();
const { getCourierOrders, updateCourierOrderStatus } = require('../controllers/courierController');
const { authenticate, verifyRole } = require('../middleware/authMiddleware');

router.use(authenticate);
router.use(verifyRole('courier'));

router.get('/orders', getCourierOrders);
router.patch('/orders/:id/status', updateCourierOrderStatus);

module.exports = router;
