const { Shop, Order, User } = require('../models');
const { startCourierAssignment } = require('../utils/courierAssignment');

// Helper to get shop id for current partner
const getPartnerShopId = async (userId) => {
  const shop = await Shop.findOne({ where: { user_id: userId } });
  return shop ? shop.id : null;
};

// @route PATCH /api/shop/settings
const updateShopSettings = async (req, res) => {
  const { shop_name, address, latitude, longitude, is_open, opening_hours } = req.body;
  const updateFields = { shop_name, address, latitude, longitude, is_open, opening_hours };

  try {
    const shopId = await getPartnerShopId(req.user.id);
    if (!shopId) return res.status(404).json({ error: 'Shop profile not found' });

    // Clean undefined fields
    Object.keys(updateFields).forEach(key => updateFields[key] === undefined && delete updateFields[key]);

    await Shop.update(updateFields, { where: { id: shopId } });

    res.json({ message: 'Shop settings updated successfully' });
  } catch (error) {
    console.error('updateShopSettings error:', error);
    res.status(500).json({ error: 'Server error updating shop settings' });
  }
};

// @route GET /api/partner/orders/pending
const getPendingOrders = async (req, res) => {
  const { limit = 10, page = 1 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  try {
    const shopId = await getPartnerShopId(req.user.id);
    if (!shopId) return res.status(404).json({ error: 'Shop profile not found' });

    const { count, rows: orders } = await Order.findAndCountAll({
      where: { shop_id: shopId, status: 'PENDING' },
      include: [{ model: User, as: 'customer', attributes: ['name', 'phone'] }],
      order: [['created_at', 'ASC']],
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
    console.error('getPendingOrders error:', error);
    res.status(500).json({ error: 'Server error fetching pending orders' });
  }
};

// @route PATCH /api/partner/orders/:id/status
const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  try {
    const shopId = await getPartnerShopId(req.user.id);
    
    const order = await Order.findOne({ where: { id, shop_id: shopId } });
    if (!order) {
        return res.status(404).json({ error: 'Order not found or unauthorized' });
    }

    await order.update({ status });

    // Socket Emit
    const io = req.app.get('io');
    if (io) {
      const customerId = order.customer_id;
      if (status === 'ACCEPTED') {
        io.to(`customer_${customerId}`).emit('order_accepted', {
            orderId: id,
            partnerName: req.user.name
        });

        // Start real sequential courier assignment (2 km, 10 s timeout, up to 3 couriers)
        startCourierAssignment(io, id, order.shop_id, customerId);
      } else {
        io.to(`customer_${customerId}`).emit('status_changed', {
            orderId: id,
            newStatus: status
        });
      }
    }

    res.json({ message: `Order status updated to ${status}` });
  } catch (error) {
    console.error('updateOrderStatus error:', error);
    res.status(500).json({ error: 'Server error updating order status' });
  }
};

// @route PATCH /api/partner/orders/:id/weight
const updateOrderWeight = async (req, res) => {
    const { id } = req.params;
    const { actual_weight, new_total_amount } = req.body;

    try {
        const shopId = await getPartnerShopId(req.user.id);
        
        const order = await Order.findOne({ where: { id, shop_id: shopId } });
        if (!order) {
            return res.status(404).json({ error: 'Order not found or unauthorized' });
        }

        await order.update({ actual_weight, total_amount: new_total_amount });

        res.json({ message: 'Order weight and total amount updated successfully' });
    } catch (error) {
        console.error('updateOrderWeight error:', error);
        res.status(500).json({ error: 'Server error updating order weight' });
    }
}

// @route GET /api/partner/wallet/balance
const getWalletBalance = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({ balance: user.balance });
    } catch (error) {
        console.error('getWalletBalance error:', error);
        res.status(500).json({ error: 'Server error fetching wallet balance' });
    }
}

// @route POST /api/partner/wallet/withdraw
const withdrawFunds = async (req, res) => {
    const { amount } = req.body;

    try {
        const user = await User.findByPk(req.user.id);
        const currentBalance = parseFloat(user.balance);

        if (currentBalance < amount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        const newBalance = currentBalance - amount;
        await user.update({ balance: newBalance });

        // Socket Emit
        const io = req.app.get('io');
        if (io) {
            io.to(`partner_${req.user.id}`).emit('wallet_update', { newBalance });
        }

        res.json({ message: 'Withdrawal successful', newBalance });
    } catch (error) {
        console.error('withdrawFunds error:', error);
        res.status(500).json({ error: 'Server error during withdrawal' });
    }
}

module.exports = {
  updateShopSettings,
  getPendingOrders,
  updateOrderStatus,
  updateOrderWeight,
  getWalletBalance,
  withdrawFunds
};
