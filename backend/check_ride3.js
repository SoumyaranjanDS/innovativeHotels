const mongoose = require('mongoose');
require('./src/models/Booking');

mongoose.connect('mongodb://localhost:27017/inov-hotel-system').then(async () => {
  const allRides = await mongoose.model('Booking').find().lean();
  console.log(allRides.map(r => ({
    id: r._id,
    type: r.bookingType,
    status: r.cabBooking?.status,
    otp: r.cabBooking?.otp,
    hotelOtp: r.hotelBooking?.otp
  })));
  process.exit(0);
});
