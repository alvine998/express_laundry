const sequelize = require('../config/db');

const User = require('./User');
const Shop = require('./Shop');
const Address = require('./Address');
const Service = require('./Service');
const Package = require('./Package');
const Order = require('./Order');
const Category = require('./Category');

// User <-> Shop
User.hasMany(Shop, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Shop.belongsTo(User, { foreignKey: 'user_id' });

// User <-> Address
User.hasMany(Address, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Address.belongsTo(User, { foreignKey: 'user_id' });

// Shop <-> Service
Shop.hasMany(Service, { foreignKey: 'shop_id', onDelete: 'CASCADE' });
Service.belongsTo(Shop, { foreignKey: 'shop_id' });

// Service <-> Package
Service.hasMany(Package, { foreignKey: 'service_id', onDelete: 'CASCADE' });
Package.belongsTo(Service, { foreignKey: 'service_id' });

// Category <-> Service
Category.hasMany(Service, { foreignKey: 'category_id', onDelete: 'SET NULL' });
Service.belongsTo(Category, { foreignKey: 'category_id', as: 'categoryData' });

// Order <-> User (Customer)
User.hasMany(Order, { foreignKey: 'customer_id', as: 'orders', onDelete: 'CASCADE' });
Order.belongsTo(User, { foreignKey: 'customer_id', as: 'customer' });

// Order <-> Shop
Shop.hasMany(Order, { foreignKey: 'shop_id', as: 'orders', onDelete: 'CASCADE' });
Order.belongsTo(Shop, { foreignKey: 'shop_id', as: 'shop' });

// Order <-> User (Courier)
User.hasMany(Order, { foreignKey: 'courier_id', as: 'courierOrders' });
Order.belongsTo(User, { foreignKey: 'courier_id', as: 'courier' });

module.exports = {
  sequelize,
  User,
  Shop,
  Address,
  Service,
  Package,
  Order,
  Category
};
