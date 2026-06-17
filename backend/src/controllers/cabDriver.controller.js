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
    const vendor = await CabVendor.findOne({ $or: [{ providerId: req.user.id }, { driverId: req.user.id }] });
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });

    const notifications = await RideNotification.find({
      cabProviderId: vendor._id,
      status: 'sent'
    }).populate({
      path: 'bookingId',
      match: { 'cabBooking.status': { $in: ['requested', 'hotel_cabs_notified', 'external_cabs_notified'] } }
    });

    // Filter out notifications where booking is no longer pending
    const validRequests = notifications.filter(n => n.bookingId !== null).map(n => n.bookingId);
    res.json({ success: true, requests: validRequests });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getActiveRide = async (req, res) => {
  try {
    const vendor = await CabVendor.findOne({ $or: [{ providerId: req.user.id }, { driverId: req.user.id }] });
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });

    const activeRide = await Booking.findOne({
      'cabBooking.assignedCabProviderId': vendor._id,
      'cabBooking.status': { $in: ['accepted', 'assigned', 'on_the_way', 'arrived_at_pickup', 'trip_started'] }
    });

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
    const vendor = await CabVendor.findOne({ $or: [{ providerId: req.user.id }, { driverId: req.user.id }], isApproved: true });
    if (!vendor) return res.status(403).json({ success: false, message: 'Driver not approved or found' });
    
    if (!vendor.availability.isAvailable) {
      return res.status(400).json({ success: false, message: 'You are currently busy with another ride' });
    }

    // 2. Atomic Update on Booking
    const booking = await Booking.findOneAndUpdate(
      {
        _id: bookingId,
        'cabBooking.status': { $in: ['requested', 'notified_drivers'] } // Only if still pending
      },
      {
        $set: {
          'cabBooking.status': 'accepted',
          'cabBooking.vendorId': vendor._id,
          'cabBooking.assignedCabProviderId': vendor._id,
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

    // 3. Mark Driver as Busy
    vendor.availability.isAvailable = false;
    await vendor.save();

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
        driverInfo: vendor.vendorDetails
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

    const vendor = await CabVendor.findOne({ $or: [{ providerId: req.user.id }, { driverId: req.user.id }] });
    const booking = await Booking.findOne({ _id: bookingId, 'cabBooking.vendorId': vendor._id });

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
      booking.paymentStatus = 'cod_collected';
      booking.codCollectedBy = vendor._id;
      booking.codCollectedAt = new Date();

      // Free up driver
      vendor.availability.isAvailable = true;
      await vendor.save();

      // Generate Platform Fee from fareSnapshot
      const platformFeeAmount = booking.cabBooking.fareSnapshot?.platformFee || ((booking.totalAmount * 10) / 100);
      const driverEarningAmount = booking.cabBooking.fareSnapshot?.providerEarning || (booking.totalAmount - platformFeeAmount);
      
      await PlatformFee.create({
        bookingId: booking._id,
        providerId: vendor.providerId,
        cabProviderId: vendor._id,
        driverId: vendor.driverId,
        hotelId: vendor.hotelId,
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

    const vendor = await CabVendor.findOne({ $or: [{ providerId: req.user.id }, { driverId: req.user.id }] });
    const booking = await Booking.findOne({ _id: bookingId, 'cabBooking.vendorId': vendor._id });

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
