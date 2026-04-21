const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Order = sequelize.define('Order', {
  id: { 
    type: DataTypes.STRING(50), 
    primaryKey: true 
  },
  customer_id: { type: DataTypes.INTEGER, allowNull: false },
  shop_id: { type: DataTypes.INTEGER, allowNull: false },
  courier_id: { type: DataTypes.INTEGER, allowNull: true, defaultValue: null },
  service_info: { type: DataTypes.JSON, allowNull: false },
  status: { 
    type: DataTypes.ENUM('PENDING', 'ACCEPTED', 'PICKING_UP', 'PROCESSING', 'DELIVERING', 'COMPLETED', 'CANCELLED'), 
    defaultValue: 'PENDING' 
  },
  total_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  actual_weight: { type: DataTypes.DECIMAL(5, 2), defaultValue: null },
  payment_method: { 
    type: DataTypes.ENUM('BALANCE', 'CASH'), 
    defaultValue: 'BALANCE' 
  },
  notes: { type: DataTypes.TEXT },
}, {
  tableName: 'orders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Order;
