const mongoose = require('mongoose');
require('dotenv').config();

const Hotel = require('./src/models/Hotel');
const Room = require('./src/models/Room');
const HotelAvailability = require('./src/models/HotelAvailability');

const seedAvailability = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const hotels = await Hotel.find({ isApproved: true, status: 'approved' });
    console.log(`Found ${hotels.length} approved hotel(s)`);

    let created = 0;
    const DAYS = 90;

    for (const hotel of hotels) {
      const rooms = await Room.find({ hotelId: hotel._id });
      console.log(`  Hotel: ${hotel.profile?.hotelName} — ${rooms.length} room type(s)`);

      for (const room of rooms) {
        for (let i = 0; i < DAYS; i++) {
          const date = new Date();
          date.setHours(0, 0, 0, 0);
          date.setDate(date.getDate() + i);

          // Use upsert to avoid duplicates
          await HotelAvailability.findOneAndUpdate(
            { hotelId: hotel._id, roomId: room._id, date },
            {
              $setOnInsert: {
                hotelId: hotel._id,
                roomId: room._id,
                date,
                totalRooms: room.totalRooms,
                bookedRooms: 0,
                heldRooms: 0,
                basePrice: room.price,
                finalPrice: room.price,
                taxPercent: room.taxPercent || 18,
                discountPercent: room.discountPercent || 0,
                isBlocked: false,
              }
            },
            { upsert: true, new: true }
          );
          created++;
        }
      }
    }

    console.log(`\nSeeded ${created} availability record(s) for ${DAYS} days.`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

seedAvailability();
