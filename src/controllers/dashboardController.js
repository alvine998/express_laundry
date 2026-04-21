const { User, Order, Shop } = require('../models');
const { Op } = require('sequelize');

// @route GET /api/dashboard/admin
const getAdminDashboard = async (req, res) => {
  try {
    const rolesDistribution = await User.findAll({
      attributes: ['role', [User.sequelize.fn('COUNT', '*'), 'count']],
      group: ['role']
    });

    const orderStatuses = await Order.findAll({
      attributes: ['status', [Order.sequelize.fn('COUNT', '*'), 'count']],
      group: ['status']
    });

    const totalRevenue = await Order.sum('total_amount', {
      where: { status: 'COMPLETED' }
    });

    const totalOrders = await Order.count();

    res.json({
      metrics: {
        totalRevenue: totalRevenue || 0,
        totalOrders,
        usersDistribution: rolesDistribution,
        ordersDistribution: orderStatuses
      }
    });
  } catch (error) {
    console.error('getAdminDashboard error:', error);
    res.status(500).json({ error: 'Server error generating admin dashboard' });
  }
};

// @route GET /api/dashboard/partner
const getPartnerDashboard = async (req, res) => {
  try {
    const shop = await Shop.findOne({ where: { user_id: req.user.id } });
    if (!shop) return res.status(404).json({ error: 'Shop profile not found' });

    const shopId = shop.id;

    const orderStatuses = await Order.findAll({
      attributes: ['status', [Order.sequelize.fn('COUNT', '*'), 'count']],
      where: { shop_id: shopId },
      group: ['status']
    });

    const totalRevenue = await Order.sum('total_amount', {
      where: { shop_id: shopId, status: 'COMPLETED' }
    });

    const totalOrders = await Order.count({ where: { shop_id: shopId } });

    res.json({
      metrics: {
        shopName: shop.shop_name,
        totalRevenue: totalRevenue || 0,
        totalOrders,
        ordersDistribution: orderStatuses
      }
    });
  } catch (error) {
    console.error('getPartnerDashboard error:', error);
    res.status(500).json({ error: 'Server error generating partner dashboard' });
  }
};

// @route GET /api/dashboard/customer
const getCustomerDashboard = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['balance', 'loyalty_points']
    });

    const activeOrdersCount = await Order.count({
      where: {
        customer_id: req.user.id,
        status: {
          [Op.notIn]: ['COMPLETED', 'CANCELLED']
        }
      }
    });

    res.json({
      metrics: {
        balance: user.balance,
        loyaltyPoints: user.loyalty_points,
        activeOrdersCount
      }
    });
  } catch (error) {
    console.error('getCustomerDashboard error:', error);
    res.status(500).json({ error: 'Server error generating customer dashboard' });
  }
};

module.exports = {
  getAdminDashboard,
  getPartnerDashboard,
  getCustomerDashboard
};
