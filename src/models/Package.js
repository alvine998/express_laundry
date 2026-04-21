const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Package = sequelize.define('Package', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  service_id: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  time_estimate: { type: DataTypes.STRING(100) },
  price: { type: DataTypes.DECIMAL(15, 2), allowNull: false }
}, {
  tableName: 'packages',
  timestamps: false
});

module.exports = Package;
