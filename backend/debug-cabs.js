const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected");

  const CabVendor = require('./src/models/CabVendor');
  const Booking = require('./src/models/Booking');
  const RideNotification = require('./src/models/RideNotification');

  const vendors = await CabVendor.find({}, 'providerId driverName cabSourceType availability currentLocation isApproved');
  console.log("Vendors:", JSON.stringify(vendors, null, 2));

  const bookings = await Booking.find({ bookingType: 'CAB' }, 'bookingId cabBooking.status cabBooking.cabSourceType cabBooking.pickupLocation.address');
  console.log("Cab Bookings:", JSON.stringify(bookings, null, 2));

  const notifs = await RideNotification.find({}, 'bookingId status cabProviderId');
  console.log("Ride Notifications:", JSON.stringify(notifs, null, 2));

  process.exit(0);
}
check();
