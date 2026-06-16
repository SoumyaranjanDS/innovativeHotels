const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cron = require('node-cron');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Setup Socket.io
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5175', credentials: true }
});
app.set('io', io); // make accessible in controllers
require('./src/sockets/location.socket')(io);
require('./src/sockets/support.socket')(io);

// Middleware
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5175', credentials: true }));
app.use(helmet());
// app.use(morgan('dev'));

// Database connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/providers', require('./src/routes/provider.routes'));
app.use('/api/hotels', require('./src/routes/hotel.routes'));
app.use('/api/cabs', require('./src/routes/cab.routes'));
app.use('/api/hotel-cabs', require('./src/routes/hotel-cab.routes'));
app.use('/api/bookings', require('./src/routes/booking.routes'));
app.use('/api/hotel-bookings', require('./src/routes/hotelBooking.routes'));
app.use('/api/admin', require('./src/routes/admin.routes'));
app.use('/api/upload', require('./src/routes/upload.routes'));
app.use('/api/support', require('./src/routes/support.routes'));

// Hold Expiry Cron Job - runs every minute
cron.schedule('* * * * *', async () => {
  try {
    const BookingHold = require('./src/models/BookingHold');
    const HotelAvailability = require('./src/models/HotelAvailability');

    const expiredHolds = await BookingHold.find({
      status: 'active',
      expiresAt: { $lt: new Date() }
    });

    for (const hold of expiredHolds) {
      // Release held rooms
      for (const date of hold.dates) {
        await HotelAvailability.updateOne(
          { hotelId: hold.hotelId, roomId: hold.roomId, date },
          { $inc: { heldRooms: -hold.roomsCount } }
        );
      }
      hold.status = 'expired';
      await hold.save();
    }

    if (expiredHolds.length > 0) {
      console.log(`[CRON] Released ${expiredHolds.length} expired hold(s)`);
    }
  } catch (err) {
    console.error('[CRON] Hold expiry error:', err.message);
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    const status = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    res.status(status).json({ success: false, message });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
