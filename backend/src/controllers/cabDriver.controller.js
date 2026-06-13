const Booking = require('../models/Booking');
const CabVendor = require('../models/CabVendor');
const RideNotification = require('../models/RideNotification');
const PlatformFee = require('../models/PlatformFee');

// Accept Ride Request Atomically
exports.acceptRide = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const providerId = req.user.id;

    // 1. Verify Driver Eligibility
    const vendor = await CabVendor.findOne({ providerId, isApproved: true });
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
          'cabBooking.acceptedAt': new Date()
        }
      },
      { new: true }
    );

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

    const vendor = await CabVendor.findOne({ providerId });
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

      // Generate Platform Fee (Assume 10% commission)
      const commissionAmount = (booking.totalAmount * 10) / 100;
      await PlatformFee.create({
        bookingId: booking._id,
        providerId: vendor.providerId,
        grossFare: booking.totalAmount,
        platformFee: commissionAmount,
        driverEarning: booking.totalAmount - commissionAmount,
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
