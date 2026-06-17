const mongoose = require('mongoose');
require('./src/models/Booking');
require('./src/models/CabVendor');

mongoose.connect('mongodb://localhost:27017/inov-hotel-system').then(async () => {
  const activeRide = await mongoose.model('Booking').findOne({
    bookingType: 'CAB',
    'cabBooking.status': { $in: ['accepted', 'assigned', 'on_the_way', 'arrived_at_pickup', 'trip_started'] }
  }).lean();
  console.log(activeRide ? {
    id: activeRide._id,
    status: activeRide.cabBooking.status,
    otp: activeRide.cabBooking.otp,
    vendorId: activeRide.cabBooking.vendorId,
    assignedCabProviderId: activeRide.cabBooking.assignedCabProviderId
  } : 'No active ride');
  process.exit(0);
});
