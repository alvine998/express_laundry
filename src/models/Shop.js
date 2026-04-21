const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Shop = sequelize.define('Shop', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  shop_name: { type: DataTypes.STRING, allowNull: false },
  shop_photo: { type: DataTypes.STRING },
  address: { type: DataTypes.TEXT, allowNull: false },
  latitude: { type: DataTypes.DECIMAL(10, 8) },
  longitude: { type: DataTypes.DECIMAL(11, 8) },
  rating: { type: DataTypes.DECIMAL(2, 1), defaultValue: 0.0 },
  is_open: { type: DataTypes.BOOLEAN, defaultValue: true },
  opening_hours: { type: DataTypes.STRING },
}, {
  tableName: 'shops',
  timestamps: false
});

module.exports = Shop;
