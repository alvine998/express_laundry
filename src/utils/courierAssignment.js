const { QueryTypes } = require('sequelize');
const { sequelize, Order, User, Shop } = require('../models');

const TIMEOUT_MS = 10000; // 10 seconds per courier
const MAX_ATTEMPTS = 3;   // try up to 3 couriers
const RADIUS_KM = 2;      // 2 km radius

// In-memory map: orderId -> assignment state
// { couriers, currentIndex, timer, resolved, customerId, orderPayload }
const activeAssignments = new Map();

async function findNearbyCouriers(shopLat, shopLon) {
  return sequelize.query(
    `SELECT id, name, phone, socket_id,
      (6371 * acos(
        cos(radians(:lat)) * cos(radians(latitude)) *
        cos(radians(longitude) - radians(:lon)) +
        sin(radians(:lat)) * sin(radians(latitude))
      )) AS distance
    FROM users
    WHERE role = 'courier' AND is_online = TRUE AND socket_id IS NOT NULL
    HAVING distance < :radius
    ORDER BY distance ASC
    LIMIT :maxCount`,
    {
      replacements: { lat: shopLat, lon: shopLon, radius: RADIUS_KM, maxCount: MAX_ATTEMPTS },
      type: QueryTypes.SELECT
    }
  );
}

function offerToCurrentCourier(io, orderId) {
  const state = activeAssignments.get(orderId);
  if (!state || state.resolved) return;

  const courier = state.couriers[state.currentIndex];
  const attempt = state.currentIndex + 1;
  console.log(`[CourierAssign] Offering order ${orderId} to courier ${courier.id} (attempt ${attempt}/${state.couriers.length})`);

  if (courier.socket_id) {
    io.to(courier.socket_id).emit('new_order_offer', {
      orderId,
      ...state.orderPayload,
      timeoutSeconds: TIMEOUT_MS / 1000
    });
  }

  // Start 10s countdown; move to next courier on expiry
  state.timer = setTimeout(() => {
    if (state.resolved) return;

    console.log(`[CourierAssign] Courier ${courier.id} did not respond in time for order ${orderId}`);
    state.currentIndex++;

    if (state.currentIndex < state.couriers.length) {
      offerToCurrentCourier(io, orderId);
    } else {
      state.resolved = true;
      activeAssignments.delete(orderId);
      console.log(`[CourierAssign] No courier accepted order ${orderId}`);
      io.to(`customer_${state.customerId}`).emit('courier_not_found', { orderId });
    }
  }, TIMEOUT_MS);
}

async function startCourierAssignment(io, orderId, shopId, customerId) {
  try {
    const shop = await Shop.findByPk(shopId);
    if (!shop || !shop.latitude || !shop.longitude) {
      io.to(`customer_${customerId}`).emit('courier_not_found', {
        orderId,
        reason: 'Shop location not set'
      });
      return;
    }

    const couriers = await findNearbyCouriers(
      parseFloat(shop.latitude),
      parseFloat(shop.longitude)
    );

    if (couriers.length === 0) {
      io.to(`customer_${customerId}`).emit('courier_not_found', {
        orderId,
        reason: 'No couriers available nearby'
      });
      return;
    }

    const state = {
      couriers,
      currentIndex: 0,
      timer: null,
      resolved: false,
      customerId,
      orderPayload: {
        shopName: shop.shop_name,
        shopAddress: shop.address,
        location: {
          lat: parseFloat(shop.latitude),
          lon: parseFloat(shop.longitude)
        }
      }
    };

    activeAssignments.set(orderId, state);

    // Notify customer the search has started
    io.to(`customer_${customerId}`).emit('courier_searching', { orderId });

    offerToCurrentCourier(io, orderId);
  } catch (err) {
    console.error('[CourierAssign] startCourierAssignment error:', err);
  }
}

async function handleCourierAccept(io, courierId, orderId) {
  const state = activeAssignments.get(orderId);

  if (!state || state.resolved) {
    return { success: false, reason: 'Order no longer available' };
  }

  const currentCourier = state.couriers[state.currentIndex];
  if (currentCourier.id !== courierId) {
    return { success: false, reason: 'This order was not offered to you' };
  }

  // Lock the assignment immediately to prevent race conditions
  state.resolved = true;
  clearTimeout(state.timer);
  activeAssignments.delete(orderId);

  // Persist assignment to DB
  await Order.update({ courier_id: courierId }, { where: { id: orderId } });

  const courier = await User.findByPk(courierId, {
    attributes: ['id', 'name', 'phone']
  });

  // Notify customer
  io.to(`customer_${state.customerId}`).emit('courier_assigned', {
    orderId,
    courier: { id: courier.id, name: courier.name, phone: courier.phone }
  });

  console.log(`[CourierAssign] Order ${orderId} assigned to courier ${courierId}`);
  return { success: true };
}

module.exports = { startCourierAssignment, handleCourierAccept };
