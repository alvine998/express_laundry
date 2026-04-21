const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Category = sequelize.define('Category', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  icon: { type: DataTypes.STRING }, // e.g., icon name or URL
}, {
  tableName: 'categories',
  timestamps: true,
});

module.exports = Category;
