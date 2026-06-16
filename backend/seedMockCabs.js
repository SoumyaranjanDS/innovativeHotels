const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/User');
const ProviderProfile = require('./src/models/ProviderProfile');
const Hotel = require('./src/models/Hotel');
const CabVendor = require('./src/models/CabVendor');
const Vehicle = require('./src/models/Vehicle');

mongoose.connect('mongodb://127.0.0.1:27017/ino-hotel').then(async () => {
  console.log('Connected to DB');

  const randomId = Math.floor(Math.random() * 100000);
  const provider = await User.create({
    name: 'Test Provider',
    email: `testprovider_${randomId}@example.com`,
    password: 'password123',
    mobile: '9999999999',
    role: 'Provider',
    isEmailVerified: true,
  });

  await ProviderProfile.create({
    userId: provider._id,
    businessName: 'Test Business',
    contactPerson: 'Test Provider',
    mobileNumber: '9999999999',
    status: 'verified',
    hotelService: { status: 'approved', onboardedAt: new Date() },
    cabService: { status: 'approved', onboardedAt: new Date() }
  });

  // 2. Create a mock Hotel
  const hotel = await Hotel.create({
    providerId: provider._id,
    profile: {
      hotelName: 'Grand Resort & Spa',
      description: 'A beautiful mock hotel for testing.',
      starRating: 5
    },
    location: {
      address: '123 Fake Street',
      city: 'Test City',
      state: 'Test State',
      country: 'Test Country',
      zipCode: '123456',
      coordinates: [0, 0]
    },
    status: 'approved',
    isApproved: true
  });

  // 3. Create a Hotel-Linked Cab Vendor
  const hotelCabVendor = await CabVendor.create({
    providerId: provider._id,
    cabSourceType: 'HOTEL_LINKED',
    hotelId: hotel._id,
    vendorDetails: {
      driverName: 'John Doe',
      mobile: '8888888888',
      email: 'johndoe@example.com'
    },
    isApproved: true,
    status: 'approved'
  });

  // 4. Create the Vehicle for Hotel Cab
  await Vehicle.create({
    vendorId: hotelCabVendor._id,
    cabSourceType: 'HOTEL_LINKED',
    hotelId: hotel._id,
    details: {
      vehicleType: 'Sedan',
      model: 'Honda City',
      registrationNumber: 'DL1C1234',
      seatingCapacity: 4,
      isAC: true,
      fuelType: 'Petrol',
      color: 'White'
    },
    isApproved: true
  });

  // 5. Create an Independent Cab Vendor (Agency)
  const independentCabVendor = await CabVendor.create({
    providerId: provider._id,
    cabSourceType: 'INDEPENDENT',
    vendorDetails: {
      driverName: 'Mike Smith',
      fleetCompanyName: 'Mike Travels',
      mobile: '7777777777',
      email: 'mike@example.com'
    },
    isApproved: true,
    status: 'approved'
  });

  // 6. Create the Vehicle for Independent Cab
  await Vehicle.create({
    vendorId: independentCabVendor._id,
    cabSourceType: 'INDEPENDENT',
    details: {
      vehicleType: 'SUV',
      model: 'Toyota Innova',
      registrationNumber: 'MH02AB5678',
      seatingCapacity: 6,
      isAC: true,
      fuelType: 'Diesel',
      color: 'Silver'
    },
    isApproved: true
  });

  console.log('Successfully seeded mock data: 1 Hotel, 2 Vendors, 2 Vehicles.');
  process.exit(0);
});
