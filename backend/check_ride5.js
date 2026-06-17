require('dotenv').config();
const mongoose = require('mongoose');
require('./src/models/Booking');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const activeRide = await mongoose.model('Booking').findOne({ _id: '6a324e809530dd7ed2e9ba9c' }).lean();
  console.log('Ride Created At:', activeRide.createdAt);
  process.exit(0);
});
