const express = require('express');
const router = express.Router();
const { register, login, sendOtp, verifyOtp } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/otp/send', sendOtp);
router.post('/otp/verify', verifyOtp);

module.exports = router;
