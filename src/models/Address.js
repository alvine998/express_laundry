const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Address = sequelize.define('Address', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  label: { type: DataTypes.STRING(50), allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING(20), allowNull: false },
  full_address: { type: DataTypes.TEXT, allowNull: false },
  latitude: { type: DataTypes.DECIMAL(10, 8) },
  longitude: { type: DataTypes.DECIMAL(11, 8) },
  is_default: { type: DataTypes.BOOLEAN, defaultValue: false },
  icon: { type: DataTypes.STRING(50) }
}, {
  tableName: 'user_addresses',
  timestamps: false
});

module.exports = Address;
