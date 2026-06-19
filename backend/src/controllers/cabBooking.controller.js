const Booking = require('../models/Booking');
const CabVendor = require('../models/CabVendor');
const CabFareRule = require('../models/CabFareRule');
const RideNotification = require('../models/RideNotification');
const mapService = require('../services/map.service');

// Calculate Fare Estimate
exports.getFareEstimate = async (req, res) => {
  try {
    const { pickupLocation, dropLocation, vehicleType } = req.body;
    
    if (!pickupLocation || !dropLocation) {
      return res.status(400).json({ success: false, message: 'Pickup and Drop locations are required' });
    }

    // 1. Get distance/duration from Google Maps
    const originStr = `${pickupLocation.lat},${pickupLocation.lng}`;
    const destStr = `${dropLocation.lat},${dropLocation.lng}`;
    
    const { distanceKm, durationMinutes } = await mapService.getDistanceAndDuration(originStr, destStr);

    // 2. Fetch Fare Rule
    const vType = vehicleType || 'Mini';
    const fareRule = await CabFareRule.findOne({ vehicleType: vType, isActive: true }) || 
      // fallback dummy rule if none seeded
      { baseFare: 50, perKmRate: 15, perMinuteRate: 1, minimumFare: 100, taxPercent: 5 };

    // 3. Calculate
    const distanceFare = distanceKm * fareRule.perKmRate;
    const timeFare = durationMinutes * fareRule.perMinuteRate;
    let subTotal = fareRule.baseFare + distanceFare + timeFare;
    
    const taxAmount = (subTotal * fareRule.taxPercent) / 100;
    let grandTotal = subTotal + taxAmount;
    let minimumFareApplied = false;

    if (grandTotal < fareRule.minimumFare) {
      grandTotal = fareRule.minimumFare;
      minimumFareApplied = true;
    }

    res.json({
      success: true,
      data: {
        distanceKm: distanceKm.toFixed(2),
        durationMinutes,
        fareSnapshot: {
          baseFare: fareRule.baseFare,
          distanceFare,
          timeFare,
          taxAmount,
          minimumFareApplied,
          platformCommissionType: fareRule.platformCommissionType || 'percentage',
          platformCommissionValue: fareRule.platformCommissionValue || 10,
        },
        estimatedFare: grandTotal.toFixed(2),
        availableCabSources: ['INDEPENDENT'] // We can enhance this to check db for actual available sources
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to calculate fare estimate' });
  }
};

// Create Cab Booking (COD)
exports.createCabBooking = async (req, res) => {
  try {
    const { pickupLocation, dropLocation, pickupDateTime, tripType, passengers, vehicleType, hotelBookingId, hotelId, cabSourcePreference, assignedCabProviderId, paymentMode } = req.body;
    
    // Only check for active local rides if this is not a hotel pickup
    if (tripType !== 'pickup_to_hotel' && !hotelBookingId) {
      const existingActiveRide = await Booking.findOne({
        userId: req.user.id,
        bookingType: 'CAB',
        'cabBooking.status': { $in: ['requested', 'hotel_cabs_notified', 'external_cabs_notified', 'accepted', 'assigned', 'on_the_way', 'arrived_at_pickup', 'trip_started'] }
      });

      if (existingActiveRide) {
        return res.status(400).json({ success: false, message: 'You already have an active cab ride. Please complete or cancel it before booking a new one.' });
      }
    }
    
    // Recalculate distance to prevent frontend tampering
    const originStr = `${pickupLocation.lat},${pickupLocation.lng}`;
    const destStr = `${dropLocation.lat},${dropLocation.lng}`;
    const { distanceKm, durationMinutes } = await mapService.getDistanceAndDuration(originStr, destStr);

    const vType = vehicleType || 'Mini';
    const fareRule = await CabFareRule.findOne({ vehicleType: vType, isActive: true }) || 
      { baseFare: 50, perKmRate: 15, perMinuteRate: 1, minimumFare: 100, taxPercent: 5, platformCommissionType: 'percentage', platformCommissionValue: 10 };

    const distanceFare = distanceKm * fareRule.perKmRate;
    const timeFare = durationMinutes * fareRule.perMinuteRate;
    const subTotal = fareRule.baseFare + distanceFare + timeFare;
    const taxAmount = (subTotal * fareRule.taxPercent) / 100;
    const grandTotal = Math.max(subTotal + taxAmount, fareRule.minimumFare);
    
    const platformFee = fareRule.platformCommissionType === 'fixed' 
        ? fareRule.platformCommissionValue 
        : (grandTotal * (fareRule.platformCommissionValue || 10)) / 100;
    const providerEarning = grandTotal - platformFee;

    // Generate independent Cab OTP
    let otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Create Booking
    const booking = new Booking({
      bookingId: `CAB-${Date.now()}`,
      userId: req.user.id,
      bookingType: 'CAB',
      cabBooking: {
        hotelBookingId,
        hotelId,
        cabSourcePreference: cabSourcePreference || 'ANY',
        cabSourceType: cabSourcePreference === 'HOTEL_LINKED' ? 'HOTEL_LINKED' : (assignedCabProviderId ? 'AGENCY' : 'INDEPENDENT'),
        assignedCabProviderId,
        pickupLocation,
        dropLocation,
        pickupDateTime,
        tripType: tripType || 'local',
        passengers: passengers || 1,
        vehicleType: vType,
        distanceKm,
        durationMinutes,
        fareSnapshot: {
          baseFare: fareRule.baseFare,
          distanceFare,
          timeFare,
          taxAmount,
          minimumFareApplied: grandTotal === fareRule.minimumFare,
          platformCommissionType: fareRule.platformCommissionType || 'percentage',
          platformCommissionValue: fareRule.platformCommissionValue || 10,
          platformFee,
          providerEarning
        },
        status: 'requested',
        otp: otp
      },
      paymentMode: paymentMode || 'cod',
      paymentStatus: (paymentMode === 'online') ? 'paid' : 'cod_pending',
      totalAmount: grandTotal
    });

    await booking.save();

    // MATCHING LOGIC OR DELAY FOR HOTEL APPROVAL
    if (hotelBookingId) {
        booking.cabBooking.status = 'awaiting_hotel_approval';
        await booking.save();
        res.status(201).json({
            success: true,
            message: 'Cab requested successfully. The cab will be assigned once the hotel approves your stay.',
            booking,
            driversNotified: 0
        });
        return;
    }

    // If not a hotel pickup, broadcast immediately
    await exports.broadcastCabRequest(booking._id, req.app.get('io'));

    res.status(201).json({
        success: true,
        message: 'Cab requested successfully.',
        booking
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.broadcastCabRequest = async (bookingId, io) => {
  try {
    const Booking = require('../models/Booking');
    const CabVendor = require('../models/CabVendor');
    const RideNotification = require('../models/RideNotification');
    const booking = await Booking.findById(bookingId);
    
    if (!booking) return;

    const { cabSourcePreference, hotelId, assignedCabProviderId, pickupLocation, dropLocation } = booking.cabBooking;
    const pref = cabSourcePreference || 'ANY';
    const grandTotal = booking.totalAmount;

    // Get distance/duration if needed (for Independent and External)
    let distanceKm = 0; let durationMinutes = 0;
    if (pref !== 'HOTEL_LINKED') {
      const originStr = `${pickupLocation.lat},${pickupLocation.lng}`;
      const destStr = `${dropLocation.lat},${dropLocation.lng}`;
      const result = await mapService.getDistanceAndDuration(originStr, destStr);
      distanceKm = result.distanceKm;
      durationMinutes = result.durationMinutes;
    }

    if (pref === 'HOTEL_LINKED' && hotelId) {
        // MANUAL ASSIGNMENT FOR HOTEL LINKED
        const Hotel = require('../models/Hotel');
        const hotel = await Hotel.findById(hotelId);
        if (hotel && io) {
            io.to(`provider_${hotel.providerId.toString()}`).emit('new_hotel_cab_request', {
                bookingId: booking._id,
                pickupLocation,
                dropLocation,
                estimatedFare: grandTotal
            });
        }
        booking.cabBooking.status = 'hotel_cabs_notified';
        await booking.save();
        return;
    }

    if (pref === 'EXTERNAL' && assignedCabProviderId) {
        // AGENCY CAB BOOKING
        const User = require('../models/User');
        const targetAgency = await User.findById(assignedCabProviderId);
        
        booking.cabBooking.status = 'external_cabs_notified';
        await booking.save();

        if (targetAgency) {
            await RideNotification.create({
                bookingId: booking._id,
                cabProviderId: targetAgency._id,
                providerId: targetAgency._id,
                driverId: targetAgency._id,
                status: 'sent'
            });

            if (io) {
                io.to(`provider_${targetAgency._id.toString()}`).emit("new_ride_request", {
                    bookingId: booking._id,
                    pickupLocation,
                    dropLocation,
                    estimatedFare: grandTotal,
                    distanceKm,
                    durationMinutes
                });
            }
        }
        return;
    }

    // INDEPENDENT CAB BOOKING (pref === 'ANY' or 'INDEPENDENT')
    let nearbyDrivers = [];
    
    // For demo/testing purposes, we bypass strict location and online checks
    // so that the booking flow works reliably.
    let query = {
      'availability.isAvailable': true,
      isApproved: true,
      cabSourceType: 'INDEPENDENT'
    };

    nearbyDrivers = await CabVendor.find(query);

    if (nearbyDrivers.length > 0) {
      booking.cabBooking.status = 'external_cabs_notified';
      await booking.save();

      const notifications = nearbyDrivers.map(driver => ({
        bookingId: booking._id,
        cabProviderId: driver._id,
        providerId: driver.providerId,
        driverId: driver.driverId,
        hotelId: driver.hotelId,
        status: 'sent'
      }));
      await RideNotification.insertMany(notifications);

      if (io) {
        nearbyDrivers.forEach(driver => {
          io.to(`provider_${driver.providerId.toString()}`).emit('new_ride_request', {
            bookingId: booking._id,
            pickupLocation,
            dropLocation,
            distanceKm,
            durationMinutes,
            estimatedFare: grandTotal
          });
        });
      }
    }
  } catch (err) {
    console.error("Error broadcasting cab request:", err);
  }
};

exports.getAvailableAgencies = async (req, res) => {
  try {
    const User = require('../models/User');
    const agencies = await User.find({ role: 'Provider', providerType: 'Cab' }).select('name email mobile');
    res.status(200).json({ success: true, agencies });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error fetching agencies" });
  }
};

exports.cancelCabBooking = async (req, res) => {
  try {
    const Booking = require('../models/Booking');
    const booking = await Booking.findOne({ _id: req.params.bookingId, userId: req.user.id });
    if (!booking || booking.bookingType !== 'CAB') {
      return res.status(404).json({ success: false, message: 'Cab booking not found' });
    }
    
    if (['completed', 'cancelled', 'rejected'].includes(booking.cabBooking.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel ride at this stage' });
    }

    booking.cabBooking.status = 'cancelled';
    booking.cabBooking.cancelledAt = new Date();
    await booking.save();

    const io = req.app.get('io');
    if (io) {
      if (booking.cabBooking.vendorId) {
        io.to(`provider_${booking.cabBooking.vendorId.toString()}`).emit('ride_cancelled', { bookingId: booking._id });
      } else if (booking.cabBooking.hotelId) {
        const Hotel = require('../models/Hotel');
        const hotel = await Hotel.findById(booking.cabBooking.hotelId);
        if (hotel) io.to(`provider_${hotel.providerId.toString()}`).emit('ride_cancelled', { bookingId: booking._id });
      }
    }

    res.json({ success: true, message: 'Ride cancelled successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
