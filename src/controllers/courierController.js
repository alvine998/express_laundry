const { Order, Shop, User } = require('../models');

// @route GET /api/courier/orders
const getCourierOrders = async (req, res) => {
  const { limit = 10, page = 1, status } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  try {
    const where = { courier_id: req.user.id };
    if (status) where.status = status;

    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      include: [
        { model: Shop, as: 'shop', attributes: ['shop_name', 'address', 'latitude', 'longitude'] },
        { model: User, as: 'customer', attributes: ['name', 'phone'] }
      ],
      order: [['created_at', 'DESC']],
      limit: Number(limit),
      offset
    });

    res.json({
      total: count,
      page: Number(page),
      totalPages: Math.ceil(count / Number(limit)),
      orders
    });
  } catch (error) {
    console.error('getCourierOrders error:', error);
    res.status(500).json({ error: 'Server error fetching courier orders' });
  }
};

// @route PATCH /api/courier/orders/:id/status
const updateCourierOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const allowedStatuses = ['PICKING_UP', 'DELIVERING', 'COMPLETED'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${allowedStatuses.join(', ')}` });
  }

  try {
    const order = await Order.findOne({ where: { id, courier_id: req.user.id } });
    if (!order) {
      return res.status(404).json({ error: 'Order not found or not assigned to you' });
    }

    await order.update({ status });

    const io = req.app.get('io');
    if (io) {
      io.to(`customer_${order.customer_id}`).emit('status_changed', {
        orderId: id,
        newStatus: status
      });
    }

    res.json({ message: `Order status updated to ${status}` });
  } catch (error) {
    console.error('updateCourierOrderStatus error:', error);
    res.status(500).json({ error: 'Server error updating order status' });
  }
};

module.exports = { getCourierOrders, updateCourierOrderStatus };
