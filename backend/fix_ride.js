require('dotenv').config();
const mongoose = require('mongoose');
require('./src/models/Booking');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const result = await mongoose.model('Booking').updateOne(
    { _id: '6a324e809530dd7ed2e9ba9c' },
    { $set: { 'cabBooking.otp': '1234' } }
  );
  console.log('Fixed ride OTP to 1234:', result.modifiedCount > 0);
  process.exit(0);
});
