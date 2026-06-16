const mongoose = require('mongoose');
const CabVendor = require('./src/models/CabVendor');
const Vehicle = require('./src/models/Vehicle');

mongoose.connect('mongodb://127.0.0.1:27017/ino-hotel').then(async () => {
  const vehicles = await Vehicle.find();
  console.log('Total Vehicles:', vehicles.length);
  
  const approvedVehicles = await Vehicle.find({ isApproved: true });
  console.log('Approved Vehicles:', approvedVehicles.length);
  
  const hotelCabs = await Vehicle.find({ isApproved: true, cabSourceType: 'HOTEL_LINKED' });
  console.log('Approved Hotel Cabs:', hotelCabs.length);
  
  const hotelCabsWithHotelId = await Vehicle.find({ isApproved: true, cabSourceType: 'HOTEL_LINKED', hotelId: { $exists: true, $ne: null } });
  console.log('With HotelId:', hotelCabsWithHotelId.length);
  
  const unapprovedHotelCabs = await Vehicle.find({ isApproved: false, cabSourceType: 'HOTEL_LINKED' });
  console.log('Unapproved Hotel Cabs:', unapprovedHotelCabs.length);

  process.exit(0);
});
