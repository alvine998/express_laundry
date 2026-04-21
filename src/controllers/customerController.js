const { User, Address, Order, Shop } = require('../models');

// @route GET /api/profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'phone', 'role', 'balance', 'loyalty_points', 'created_at']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ profile: user });
  } catch (error) {
    console.error('getProfile error:', error);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
};

// @route GET /api/addresses
const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.findAll({ where: { user_id: req.user.id } });
    res.json({ addresses });
  } catch (error) {
    console.error('getAddresses error:', error);
    res.status(500).json({ error: 'Server error fetching addresses' });
  }
};

// @route POST /api/addresses
const addAddress = async (req, res) => {
  const { label, name, phone, full_address, latitude, longitude, is_default, icon } = req.body;

  try {
    if (is_default) {
      await Address.update({ is_default: false }, { where: { user_id: req.user.id } });
    }

    const address = await Address.create({
      user_id: req.user.id,
      label,
      name,
      phone,
      full_address,
      latitude,
      longitude,
      is_default: is_default || false,
      icon
    });

    res.status(201).json({ message: 'Address added successfully', addressId: address.id });
  } catch (error) {
    console.error('addAddress error:', error);
    res.status(500).json({ error: 'Server error adding address' });
  }
};

// @route PATCH /api/addresses/:id
const updateAddress = async (req, res) => {
  const { id } = req.params;
  const { is_default, ...updateFields } = req.body;

  try {
    const address = await Address.findOne({ where: { id, user_id: req.user.id } });
    if (!address) {
      return res.status(404).json({ error: 'Address not found or unauthorized' });
    }

    if (is_default) {
      await Address.update({ is_default: false }, { where: { user_id: req.user.id } });
    }

    if (is_default !== undefined) {
      updateFields.is_default = is_default;
    }

    await address.update(updateFields);

    res.json({ message: 'Address updated successfully' });
  } catch (error) {
    console.error('updateAddress error:', error);
    res.status(500).json({ error: 'Server error updating address' });
  }
};

// @route POST /api/orders
const placeOrder = async (req, res) => {
  const { shop_id, service_info, total_amount, payment_method, notes } = req.body;

  try {
    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const order = await Order.create({
      id: orderId,
      customer_id: req.user.id,
      shop_id,
      service_info,
      total_amount,
      payment_method: payment_method || 'BALANCE',
      notes
    });

    const io = req.app.get('io');
    if (io) {
      console.log(`Emitting order_new to shop_${shop_id}`);
      io.to(`shop_${shop_id}`).emit('order_new', {
        orderId,
        customerName: req.user.name,
        total: total_amount
      });
    }

    res.status(201).json({ message: 'Order placed successfully', orderId });
  } catch (error) {
    console.error('placeOrder error:', error);
    res.status(500).json({ error: 'Server error placing order' });
  }
};

// @route GET /api/orders/history
const getOrderHistory = async (req, res) => {
  const { limit = 10, page = 1 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  try {
    const { count, rows: orders } = await Order.findAndCountAll({
      where: { customer_id: req.user.id },
      include: [{ model: Shop, as: 'shop', attributes: ['shop_name'] }],
      order: [['created_at', 'DESC']],
      limit: Number(limit),
      offset: offset
    });

    res.json({
      total: count,
      page: Number(page),
      totalPages: Math.ceil(count / Number(limit)),
      orders
    });
  } catch (error) {
    console.error('getOrderHistory error:', error);
    res.status(500).json({ error: 'Server error fetching order history' });
  }
};

module.exports = {
  getProfile,
  getAddresses,
  addAddress,
  updateAddress,
  placeOrder,
  getOrderHistory,
};
