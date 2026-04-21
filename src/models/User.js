const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  phone: { type: DataTypes.STRING(20), allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { 
    type: DataTypes.ENUM('customer', 'partner', 'courier', 'admin'), 
    allowNull: false 
  },
  profile_photo: { type: DataTypes.STRING },
  balance: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0.00 },
  loyalty_points: { type: DataTypes.INTEGER, defaultValue: 0 },
  is_online: { type: DataTypes.BOOLEAN, defaultValue: false },
  socket_id: { type: DataTypes.STRING },
  latitude: { type: DataTypes.DECIMAL(10, 8) },
  longitude: { type: DataTypes.DECIMAL(11, 8) },
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = User;
