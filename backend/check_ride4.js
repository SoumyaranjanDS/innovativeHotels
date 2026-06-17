require('dotenv').config();
const mongoose = require('mongoose');
require('./src/models/Booking');
require('./src/models/CabVendor');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const activeRide = await mongoose.model('Booking').findOne({
    bookingType: 'CAB',
    'cabBooking.status': { $in: ['accepted', 'assigned', 'on_the_way', 'arrived_at_pickup', 'trip_started'] }
  }).sort({ createdAt: -1 }).lean();
  
  if (activeRide) {
    console.log('Active Ride:', {
      id: activeRide._id,
      status: activeRide.cabBooking?.status,
      otp: activeRide.cabBooking?.otp,
      vendorId: activeRide.cabBooking?.vendorId,
      assignedProvider: activeRide.cabBooking?.assignedCabProviderId
    });
  } else {
    console.log('No active ride found');
  }
  process.exit(0);
});
