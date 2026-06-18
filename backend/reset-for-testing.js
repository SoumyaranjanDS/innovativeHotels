const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected to DB");

    const Booking = require('./src/models/Booking');
    const RideNotification = require('./src/models/RideNotification');
    const HotelAvailability = require('./src/models/HotelAvailability');

    // 1. Delete all bookings
    const bookingResult = await Booking.deleteMany({});
    console.log(`Deleted ${bookingResult.deletedCount} bookings`);

    // 2. Delete all ride notifications
    const notifResult = await RideNotification.deleteMany({});
    console.log(`Deleted ${notifResult.deletedCount} ride notifications`);

    // 3. Reset all room availability (set bookedRooms to 0)
    const availResult = await HotelAvailability.updateMany({}, { $set: { bookedRooms: 0 } });
    console.log(`Reset ${availResult.modifiedCount} availability records (bookedRooms → 0)`);

    console.log("\n✅ All bookings, notifications cleared. All rooms freed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("Connection error:", err);
    process.exit(1);
  });
