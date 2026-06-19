const Booking = require('../models/Booking');
const CabVendor = require('../models/CabVendor');
const RideNotification = require('../models/RideNotification');
const PlatformFee = require('../models/PlatformFee');

exports.updateLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const vendor = await CabVendor.findOneAndUpdate(
      { $or: [{ providerId: req.user.id }, { driverId: req.user.id }] },
      { 
        currentLocation: { type: 'Point', coordinates: [lng, lat] },
        lastLocationUpdatedAt: new Date()
      },
      { new: true }
    );
    res.json({ success: true, currentLocation: vendor.currentLocation });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getRideRequests = async (req, res) => {
  try {
    // Collect ALL possible IDs this user might be identified by in RideNotification
    const possibleIds = [req.user.id]; // Always include the User._id
    
    // Also check if user has a CabVendor record
    const vendors = await CabVendor.find({ $or: [{ providerId: req.user.id }, { driverId: req.user.id }] });
    for (const v of vendors) {
      possibleIds.push(v._id);
    }

    // Convert to ObjectIds for consistent comparison
    const mongoose = require('mongoose');
    const objectIds = possibleIds.map(id => new mongoose.Types.ObjectId(id));

    const notifications = await RideNotification.find({
      cabProviderId: { $in: objectIds },
      status: 'sent'
    }).populate({
      path: 'bookingId',
      match: { 'cabBooking.status': { $in: ['requested', 'hotel_cabs_notified', 'external_cabs_notified'] } }
    });

    // Filter out notifications where booking is no longer pending
    const validRequests = notifications.filter(n => n.bookingId !== null).map(n => {
      const b = n.bookingId;
      return {
        bookingId: b._id,
        pickupLocation: b.cabBooking?.pickupLocation,
        dropLocation: b.cabBooking?.dropLocation,
        estimatedFare: b.totalAmount,
        distanceKm: b.cabBooking?.distanceKm,
        durationMinutes: b.cabBooking?.durationMinutes
      };
    });
    console.log(`[getRideRequests] userId=${req.user.id}, possibleIds=${objectIds}, found ${validRequests.length} requests`);
    res.json({ success: true, requests: validRequests });
  } catch (err) {
    console.error('[getRideRequests] Error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getActiveRide = async (req, res) => {
  try {
    let vendorId = null;
    const vendor = await CabVendor.findOne({ $or: [{ providerId: req.user.id }, { driverId: req.user.id }] });
    if (vendor) {
      vendorId = vendor._id;
    } else {
      const User = require('../models/User');
      const user = await User.findById(req.user.id);
      if (user && user.role === 'Provider' && user.providerType === 'Cab') {
        vendorId = user._id;
      } else {
        return res.status(404).json({ success: false, message: 'Vendor not found' });
      }
    }

    const activeRide = await Booking.findOne({
      $or: [
        { 'cabBooking.assignedCabProviderId': vendorId },
        { 'cabBooking.vendorId': vendorId }
      ],
      'cabBooking.status': { $in: ['accepted', 'assigned', 'on_the_way', 'arrived_at_pickup', 'trip_started'] }
    }).populate('userId', 'name email mobile');

    res.json({ success: true, activeRide });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Accept Ride Request Atomically
exports.acceptRide = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const providerId = req.user.id;

    // 1. Verify Driver Eligibility
    let vendorId = null;
    let isAgency = false;
    let vendor = await CabVendor.findOne({ $or: [{ providerId: req.user.id }, { driverId: req.user.id }], isApproved: true });
    
    if (vendor) {
      vendorId = vendor._id;
      if (!vendor.availability.isAvailable) {
        return res.status(400).json({ success: false, message: 'You are currently busy with another ride' });
      }
    } else {
      const User = require('../models/User');
      const user = await User.findById(req.user.id);
      if (user && user.role === 'Provider' && user.providerType === 'Cab') {
        vendorId = user._id;
        isAgency = true;
      } else {
        return res.status(403).json({ success: false, message: 'Driver not approved or found' });
      }
    }

    // 2. Atomic Update on Booking
    const booking = await Booking.findOneAndUpdate(
      {
        _id: bookingId,
        'cabBooking.status': { $in: ['requested', 'notified_drivers', 'external_cabs_notified', 'hotel_cabs_notified'] } // Only if still pending
      },
      {
        $set: {
          'cabBooking.status': 'accepted',
          'cabBooking.vendorId': vendorId,
          'cabBooking.assignedCabProviderId': vendorId,
          'cabBooking.acceptedAt': new Date()
        }
      },
      { new: true }
    );

    if (booking && !booking.cabBooking.otp) {
      booking.cabBooking.otp = Math.floor(100000 + Math.random() * 900000).toString();
      await booking.save();
    }

    if (!booking) {
      return res.status(400).json({ success: false, message: 'Ride no longer available or already accepted.' });
    }

    // 3. Mark Driver as Busy (if not an agency)
    if (!isAgency && vendor) {
      vendor.availability.isAvailable = false;
      await vendor.save();
    }

    // 4. Update Notification Record
    await RideNotification.findOneAndUpdate(
      { bookingId, providerId },
      { status: 'accepted', respondedAt: new Date() }
    );

    // 5. Notify Customer (Sockets)
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${booking.userId.toString()}`).emit('ride_accepted', {
        bookingId: booking._id,
        driverInfo: vendor ? vendor.vendorDetails : { fleetCompanyName: "External Agency", mobile: "N/A" }
      });
    }

    res.json({ success: true, message: 'Ride accepted successfully!', booking });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update Ride Status
exports.updateRideStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, lat, lng } = req.body;
    const providerId = req.user.id;

    let vendorId = null;
    let isAgency = false;
    const vendor = await CabVendor.findOne({ $or: [{ providerId: req.user.id }, { driverId: req.user.id }] });
    if (vendor) {
      vendorId = vendor._id;
    } else {
      vendorId = req.user.id;
      isAgency = true;
    }
    const booking = await Booking.findOne({ _id: bookingId, 'cabBooking.vendorId': vendorId });

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    booking.cabBooking.status = status;
    booking.cabBooking.statusLogs.push({
      status,
      timestamp: new Date(),
      location: lat && lng ? { lat, lng } : null
    });

    if (status === 'trip_started') booking.cabBooking.startedAt = new Date();

    if (status === 'completed') {
      booking.cabBooking.completedAt = new Date();
      
      if (booking.paymentMode === 'cod' || booking.paymentMode === 'pay_at_hotel') {
        booking.paymentStatus = 'cod_collected';
        booking.codCollectedBy = vendor ? vendor._id : vendorId;
        booking.codCollectedAt = new Date();
      }

      // Free up driver
      if (!isAgency && vendor) {
        vendor.availability.isAvailable = true;
        await vendor.save();
      }

      // Generate Platform Fee from fareSnapshot
      const platformFeeAmount = booking.cabBooking.fareSnapshot?.platformFee || ((booking.totalAmount * 10) / 100);
      const driverEarningAmount = booking.cabBooking.fareSnapshot?.providerEarning || (booking.totalAmount - platformFeeAmount);
      
      // Save earnings on the booking for the Earnings Dashboard
      booking.platformCommission = platformFeeAmount;
      booking.partnerEarning = driverEarningAmount;

      await PlatformFee.create({
        bookingId: booking._id,
        providerId: vendor ? vendor.providerId : vendorId,
        cabProviderId: vendorId,
        driverId: vendor ? vendor.driverId : vendorId,
        hotelId: vendor ? vendor.hotelId : null,
        grossFare: booking.totalAmount,
        platformFee: platformFeeAmount,
        driverEarning: driverEarningAmount,
        feeStatus: 'payable'
      });
    }

    await booking.save();

    // Notify Customer
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${booking.userId.toString()}`).emit('ride_status_changed', {
        bookingId: booking._id,
        status
      });
    }

    res.json({ success: true, booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { otp, lat, lng } = req.body;

    let vendorId = null;
    const vendor = await CabVendor.findOne({ $or: [{ providerId: req.user.id }, { driverId: req.user.id }] });
    if (vendor) {
      vendorId = vendor._id;
    } else {
      vendorId = req.user.id;
    }
    const booking = await Booking.findOne({ _id: bookingId, 'cabBooking.vendorId': vendorId });

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    
    if (booking.cabBooking.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
    }

    booking.cabBooking.status = 'trip_started';
    booking.cabBooking.startedAt = new Date();
    booking.cabBooking.statusLogs.push({
      status: 'trip_started',
      timestamp: new Date(),
      location: lat && lng ? { lat, lng } : null
    });

    await booking.save();

    // Notify Customer
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${booking.userId.toString()}`).emit('ride_status_changed', {
        bookingId: booking._id,
        status: 'trip_started'
      });
    }

    res.json({ success: true, booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getDriverProfile = async (req, res) => {
  try {
    const vendor = await CabVendor.findOne({ $or: [{ providerId: req.user.id }, { driverId: req.user.id }] });
    if (!vendor) return res.status(404).json({ success: false, message: 'Driver profile not found' });

    const Vehicle = require('../models/Vehicle');
    const vehicle = await Vehicle.findOne({ vendorId: vendor._id });

    res.json({
      success: true,
      data: {
        vendor,
        vehicle
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getRideHistory = async (req, res) => {
  try {
    let vendorId = null;
    const vendor = await CabVendor.findOne({ $or: [{ providerId: req.user.id }, { driverId: req.user.id }] });
    if (vendor) {
      vendorId = vendor._id;
    } else {
      const User = require('../models/User');
      const user = await User.findById(req.user.id);
      if (user && user.role === 'Provider' && user.providerType === 'Cab') {
        vendorId = user._id;
      } else {
        return res.status(404).json({ success: false, message: 'Vendor not found' });
      }
    }

    const limit = parseInt(req.query.limit) || 50;

    const history = await Booking.find({
      $or: [
        { 'cabBooking.assignedCabProviderId': vendorId },
        { 'cabBooking.vendorId': vendorId },
        { 'cabBooking.assignedCabProviderId': req.user.id }
      ],
      'cabBooking.status': { $in: ['completed', 'cancelled', 'rejected'] }
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('userId', 'name email mobile')
      .lean();

    // Attach driver details and platform fee for each booking
    const PlatformFee = require('../models/PlatformFee');
    const User = require('../models/User');

    const enriched = await Promise.all(history.map(async (booking) => {
      let driverInfo = null;
      const driverId = booking.cabBooking?.driverId || booking.cabBooking?.assignedDriverId;
      if (driverId) {
        const driver = await User.findById(driverId, 'name email mobile').lean();
        driverInfo = driver;
      }

      // Platform fee for this booking
      const fee = await PlatformFee.findOne({ bookingId: booking._id }).lean();

      return {
        ...booking,
        driverInfo,
        platformFee: fee ? fee.amount : null,
        netAmount: fee ? (booking.totalAmount - fee.amount) : booking.totalAmount,
      };
    }));

    res.json({ success: true, history: enriched });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

