const CabVendor = require('../models/CabVendor');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join a specific room based on user role/ID
    socket.on('join_room', ({ role, id }) => {
      const roomName = `${role}_${id}`;
      socket.join(roomName);
      console.log(`Socket ${socket.id} joined room ${roomName}`);
    });

    // Driver emits location update
    socket.on('driver_location_update', async (data) => {
      try {
        const { providerId, lat, lng, customerId } = data;
        
        // Broadcast to the specific customer if they are tracking
        if (customerId) {
          io.to(`user_${customerId}`).emit('cab_location_updated', { lat, lng });
        }

        // Persist to DB (maybe throttle this to avoid spamming DB)
        await CabVendor.findOneAndUpdate(
          { providerId },
          { 
            currentLocation: { type: 'Point', coordinates: [lng, lat] },
            lastLocationUpdatedAt: new Date()
          }
        );
      } catch (err) {
        console.error('Socket Location Update Error:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};
