const { Service, Package, Shop, Category } = require('../models');

// Helper: get shop_id for the current partner
const getPartnerShopId = async (userId) => {
  const shop = await Shop.findOne({ where: { user_id: userId } });
  return shop ? shop.id : null;
};

// @route GET /api/services
const getServices = async (req, res) => {
  const { shop_id, category_id, limit = 10, page = 1 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const whereCondition = {};
  if (shop_id) whereCondition.shop_id = shop_id;
  if (category_id) whereCondition.category_id = category_id;

  try {
    const { count, rows: services } = await Service.findAndCountAll({
      where: whereCondition,
      include: [
        { model: Category, as: 'categoryData', attributes: ['id', 'name', 'icon'] },
        { model: Package }
      ],
      limit: Number(limit),
      offset,
      order: [['id', 'ASC']]
    });

    res.json({
      total: count,
      page: Number(page),
      totalPages: Math.ceil(count / Number(limit)),
      services
    });
  } catch (error) {
    console.error('getServices error:', error);
    res.status(500).json({ error: 'Server error fetching services' });
  }
};

// @route GET /api/services/:id
const getServiceById = async (req, res) => {
  const { id } = req.params;

  try {
    const service = await Service.findByPk(id, {
      include: [
        { model: Category, as: 'categoryData', attributes: ['id', 'name', 'icon'] },
        { model: Package }
      ]
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json({ service });
  } catch (error) {
    console.error('getServiceById error:', error);
    res.status(500).json({ error: 'Server error fetching service' });
  }
};

// @route POST /api/services
const createService = async (req, res) => {
  const { name, category_id, icon, color } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Service name is required' });
  }

  try {
    const shopId = await getPartnerShopId(req.user.id);
    if (!shopId) return res.status(404).json({ error: 'Shop profile not found. Register as a partner first.' });

    const service = await Service.create({
      shop_id: shopId,
      name,
      category_id,
      icon,
      color
    });

    res.status(201).json({ message: 'Service created successfully', service });
  } catch (error) {
    console.error('createService error:', error);
    res.status(500).json({ error: 'Server error creating service' });
  }
};

// @route PATCH /api/services/:id
const updateService = async (req, res) => {
  const { id } = req.params;
  const { name, category_id, icon, color } = req.body;

  try {
    const shopId = await getPartnerShopId(req.user.id);
    if (!shopId) return res.status(404).json({ error: 'Shop profile not found' });

    const service = await Service.findOne({ where: { id, shop_id: shopId } });
    if (!service) {
      return res.status(404).json({ error: 'Service not found or unauthorized' });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (category_id !== undefined) updates.category_id = category_id;
    if (icon !== undefined) updates.icon = icon;
    if (color !== undefined) updates.color = color;

    await service.update(updates);

    res.json({ message: 'Service updated successfully', service });
  } catch (error) {
    console.error('updateService error:', error);
    res.status(500).json({ error: 'Server error updating service' });
  }
};

// @route DELETE /api/services/:id
const deleteService = async (req, res) => {
  const { id } = req.params;

  try {
    const shopId = await getPartnerShopId(req.user.id);
    if (!shopId) return res.status(404).json({ error: 'Shop profile not found' });

    const service = await Service.findOne({ where: { id, shop_id: shopId } });
    if (!service) {
      return res.status(404).json({ error: 'Service not found or unauthorized' });
    }

    await service.destroy();
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('deleteService error:', error);
    res.status(500).json({ error: 'Server error deleting service' });
  }
};

module.exports = {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService
};
