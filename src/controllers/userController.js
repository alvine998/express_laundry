const { User } = require('../models');
const { Op } = require('sequelize');
const { hashPassword } = require('../utils/authUtils');

// @route GET /api/users
// @desc Get list of users with optional filtering
const getUsers = async (req, res) => {
  const { role, is_online, search, limit = 10, page = 1 } = req.query;

  const whereCondition = {};

  if (role) {
    whereCondition.role = role;
  }

  if (is_online !== undefined) {
    whereCondition.is_online = is_online === 'true';
  }

  if (search) {
    whereCondition[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } }
    ];
  }

  const offset = (Number(page) - 1) * Number(limit);

  try {
    const { count, rows: users } = await User.findAndCountAll({
      where: whereCondition,
      attributes: { exclude: ['password'] }, // Never return passwords
      limit: Number(limit),
      offset: offset,
      order: [['created_at', 'DESC']]
    });

    res.json({
      total: count,
      page: Number(page),
      totalPages: Math.ceil(count / Number(limit)),
      users
    });
  } catch (error) {
    console.error('getUsers error:', error);
    res.status(500).json({ error: 'Server error fetching users' });
  }
};

// @route PUT /api/users/:id
// @desc Update user details
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, phone, role, password, balance, loyalty_points } = req.body;

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updates = {};
    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (role) updates.role = role;
    if (balance !== undefined) updates.balance = balance;
    if (loyalty_points !== undefined) updates.loyalty_points = loyalty_points;
    
    if (password) {
      updates.password = await hashPassword(password);
    }

    await user.update(updates);

    const updatedUser = user.toJSON();
    delete updatedUser.password; // Don't return the hash

    res.json({ message: 'User updated successfully', user: updatedUser });
  } catch (error) {
    console.error('updateUser error:', error);
    res.status(500).json({ error: 'Server error updating user' });
  }
};

// @route DELETE /api/users/:id
// @desc Delete a user
const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.destroy();
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('deleteUser error:', error);
    res.status(500).json({ error: 'Server error deleting user' });
  }
};

module.exports = {
  getUsers,
  updateUser,
  deleteUser
};
