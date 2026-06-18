const mongoose = require('mongoose');
const Booking = require('./src/models/Booking');
const cabBookingController = require('./src/controllers/cabBooking.controller');
const dotenv = require('dotenv');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log("Connected to DB");
    
    // Find cabs waiting for approval
    const stuckCabs = await Booking.find({
      bookingType: 'CAB',
      'cabBooking.status': 'awaiting_hotel_approval'
    });

    console.log(`Found ${stuckCabs.length} stuck cabs`);

    for (let cab of stuckCabs) {
      if (cab.cabBooking.hotelBookingId) {
        const hotelBooking = await Booking.findById(cab.cabBooking.hotelBookingId);
        if (hotelBooking && hotelBooking.hotelBooking.status === 'confirmed') {
          console.log(`Fixing cab ${cab._id} for confirmed hotel ${hotelBooking._id}`);
          // Mock IO since this is a script
          const mockIo = { to: () => ({ emit: () => {} }) };
          try {
            await cabBookingController.broadcastCabRequest(cab._id, mockIo);
            console.log(`Cab ${cab._id} broadcasted successfully`);
            
            // Refetch to see status
            const updatedCab = await Booking.findById(cab._id);
            console.log(`New cab status: ${updatedCab.cabBooking.status}`);
          } catch(e) {
            console.error("Broadcast failed:", e);
          }
        }
      }
    }

    console.log("Done");
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
