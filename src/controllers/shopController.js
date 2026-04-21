const { Shop, Service, Package, sequelize } = require('../models');

// @route GET /api/shops/nearby
const getNearbyShops = async (req, res) => {
  const { lat, lon, limit = 10, page = 1 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Please provide lat and lon query parameters' });
  }

  try {
    const shops = await Shop.findAll({
      attributes: {
        include: [
          [
            sequelize.literal(`(
              6371 * acos(
                cos(radians(${lat})) * cos(radians(latitude)) *
                cos(radians(longitude) - radians(${lon})) +
                sin(radians(${lat})) * sin(radians(latitude))
              )
            )`),
            'distance'
          ]
        ]
      },
      having: sequelize.literal('distance < 5'),
      order: sequelize.literal('distance ASC'),
      limit: Number(limit),
      offset: offset
    });

    res.json({ 
        page: Number(page),
        count: shops.length,
        shops 
    });
  } catch (error) {
    console.error('getNearbyShops error:', error);
    res.status(500).json({ error: 'Server error fetching nearby shops' });
  }
};

// @route GET /api/shops/:id
const getShopDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const shop = await Shop.findByPk(id, {
      include: [
        {
          model: Service,
          include: [Package]
        }
      ]
    });

    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    // Optional format adjusting to match previous structure, though Sequelize builds an elegant nested structure natively.
    const response = {
        shop: {
            id: shop.id,
            user_id: shop.user_id,
            shop_name: shop.shop_name,
            shop_photo: shop.shop_photo,
            address: shop.address,
            latitude: shop.latitude,
            longitude: shop.longitude,
            rating: shop.rating,
            is_open: shop.is_open,
            opening_hours: shop.opening_hours
        },
        services: shop.Services
    };

    res.json(response);
  } catch (error) {
    console.error('getShopDetails error:', error);
    res.status(500).json({ error: 'Server error fetching shop details' });
  }
};

module.exports = {
  getNearbyShops,
  getShopDetails,
};
