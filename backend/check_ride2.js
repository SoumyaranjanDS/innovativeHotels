const mongoose = require('mongoose');
require('./src/models/Booking');

mongoose.connect('mongodb://localhost:27017/inov-hotel-system').then(async () => {
  const allRides = await mongoose.model('Booking').find({ bookingType: 'CAB' }).lean();
  console.log(allRides.map(r => ({
    id: r._id,
    status: r.cabBooking.status,
    otp: r.cabBooking.otp
  })));
  process.exit(0);
});
