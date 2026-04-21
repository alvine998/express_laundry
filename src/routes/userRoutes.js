const express = require('express');
const router = express.Router();
const { getUsers, updateUser, deleteUser } = require('../controllers/userController');
const { authenticate } = require('../middleware/authMiddleware');

// Note: Depending on your access control, you might want to wrap this behind an 'admin' verification role.
// For now, it rests behind general authentication.
router.get('/', authenticate, getUsers);
router.put('/:id', authenticate, updateUser);
router.delete('/:id', authenticate, deleteUser);

module.exports = router;
