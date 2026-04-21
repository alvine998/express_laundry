const express = require('express');
const router = express.Router();
const { getNearbyShops, getShopDetails } = require('../controllers/shopController');

router.get('/nearby', getNearbyShops);
router.get('/:id', getShopDetails);

module.exports = router;
