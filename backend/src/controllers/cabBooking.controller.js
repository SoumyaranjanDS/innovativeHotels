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
    const { pickupLocation, dropLocation, pickupDateTime, tripType, passengers, vehicleType, hotelBookingId, hotelId, cabSourcePreference } = req.body;
    
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

    // Create Booking
    const booking = new Booking({
      bookingId: `CAB-${Date.now()}`,
      userId: req.user.id,
      bookingType: 'CAB',
      cabBooking: {
        hotelBookingId,
        hotelId,
        cabSourcePreference: cabSourcePreference || 'ANY',
        cabSourceType: cabSourcePreference === 'HOTEL_LINKED' ? 'HOTEL_LINKED' : 'INDEPENDENT',
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
        status: 'requested'
      },
      paymentMode: 'cod',
      paymentStatus: 'cod_pending',
      totalAmount: grandTotal
    });

    await booking.save();

    // MATCHING LOGIC
    let nearbyDrivers = [];
    const maxDistance = 5000; // 5km
    const pref = cabSourcePreference || 'ANY';
    const io = req.app.get('io');

    if (pref === 'HOTEL_LINKED' && hotelId) {
        // MANUAL ASSIGNMENT FOR HOTEL LINKED
        // Do not broadcast to individual drivers. Just notify the hotel owner.
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
        res.status(201).json({
            success: true,
            message: 'Cab requested successfully. Hotel will assign a driver.',
            booking,
            driversNotified: 0
        });
        return;
    }

    let query = {
      'availability.isOnline': true,
      'availability.isAvailable': true,
      isApproved: true,
      cabSourceType: 'INDEPENDENT'
    };

    query.currentLocation = {
      $near: {
        $geometry: { type: 'Point', coordinates: [pickupLocation.lng, pickupLocation.lat] },
        $maxDistance: maxDistance
      }
    };
    nearbyDrivers = await CabVendor.find(query);

    if (nearbyDrivers.length > 0) {
      booking.cabBooking.status = 'external_cabs_notified';
      await booking.save();

      // Create Notifications
      const notifications = nearbyDrivers.map(driver => ({
        bookingId: booking._id,
        cabProviderId: driver._id,
        providerId: driver.providerId,
        driverId: driver.driverId,
        hotelId: driver.hotelId,
        status: 'sent'
      }));
      await RideNotification.insertMany(notifications);

      // Emit Socket events
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

    res.status(201).json({
      success: true,
      message: 'Booking created. Searching for independent drivers.',
      booking,
      driversNotified: nearbyDrivers.length
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
