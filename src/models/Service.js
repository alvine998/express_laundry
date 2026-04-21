const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Service = sequelize.define('Service', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  shop_id: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  category_id: { type: DataTypes.INTEGER },
  photo: { type: DataTypes.STRING },
  icon: { type: DataTypes.STRING(50) },
  color: { type: DataTypes.STRING(7) }
}, {
  tableName: 'services',
  timestamps: false
});

module.exports = Service;
