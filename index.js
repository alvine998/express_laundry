const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./src/routes/authRoutes');
const shopRoutes = require('./src/routes/shopRoutes');
const customerRoutes = require('./src/routes/customerRoutes');
const partnerRoutes = require('./src/routes/partnerRoutes');
const courierRoutes = require('./src/routes/courierRoutes');
const userRoutes = require('./src/routes/userRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const serviceRoutes = require('./src/routes/serviceRoutes');
const uploadRoutes = require('./src/routes/uploadRoutes');
const { verifyToken } = require('./src/utils/authUtils');
const { handleCourierAccept } = require('./src/utils/courierAssignment');
const { sequelize, Shop, User } = require('./src/models');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Make io accessible in controllers
app.set('io', io);

app.use(cors());
app.use(express.json());

// ------------------------------------------------------------------
// Routes
// ------------------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/partner', partnerRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/courier', courierRoutes);

app.get('/', (req, res) => {
  res.send('Laundry App Backend API is running');
});

// ------------------------------------------------------------------
// Socket.io Setup
// ------------------------------------------------------------------
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('identify', async (data) => {
    try {
        const decoded = verifyToken(data.token);
        if (decoded.role === 'customer') {
            socket.join(`customer_${decoded.id}`);
            console.log(`Socket ${socket.id} joined customer_${decoded.id}`);
        } else if (decoded.role === 'partner') {
            socket.join(`partner_${decoded.id}`);
            console.log(`Socket ${socket.id} joined partner_${decoded.id}`);
            
            // Also join the shop room to receive order_new
            const shop = await Shop.findOne({ where: { user_id: decoded.id } });
            if (shop) {
                socket.join(`shop_${shop.id}`);
                console.log(`Socket ${socket.id} joined shop_${shop.id}`);
            }
        } else if (decoded.role === 'courier') {
            socket.join(`courier_${decoded.id}`);
            console.log(`Socket ${socket.id} joined courier_${decoded.id}`);
            
            // Mark online
            await User.update({ is_online: true, socket_id: socket.id }, { where: { id: decoded.id } });
        }
    } catch (e) {
        console.error('Socket authentication failed:', e.message);
    }
  });

  socket.on('update_location', async (data) => {
    // data should contain { token, latitude, longitude }
    try {
        const decoded = verifyToken(data.token);
        if (decoded.role === 'courier') {
            await User.update({ 
                latitude: data.latitude, 
                longitude: data.longitude 
            }, { where: { id: decoded.id } });
        }
    } catch (e) {
        console.error('Location update failed:', e.message);
    }
  });

  socket.on('accept_order', async (data) => {
    // data: { token, orderId }
    try {
      const decoded = verifyToken(data.token);
      if (decoded.role !== 'courier') {
        socket.emit('order_accept_result', { success: false, reason: 'Not a courier' });
        return;
      }
      const result = await handleCourierAccept(io, decoded.id, data.orderId);
      socket.emit('order_accept_result', { orderId: data.orderId, ...result });
    } catch (e) {
      console.error('accept_order socket error:', e.message);
      socket.emit('order_accept_result', { success: false, reason: 'Invalid token' });
    }
  });

  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    // Find courier by socket_id and mark offline
    await User.update({ is_online: false, socket_id: null }, { where: { socket_id: socket.id } });
  });
});

// ------------------------------------------------------------------
// Server Listen & DB Sync
// ------------------------------------------------------------------
const PORT = process.env.PORT || 3000;

sequelize.sync({ alter: true }).then(() => {
    console.log('Database synced successfully via Sequelize.');
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to sync database:', err);
});
