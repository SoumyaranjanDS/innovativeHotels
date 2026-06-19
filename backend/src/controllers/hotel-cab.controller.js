const CabVendor = require('../models/CabVendor');
const Vehicle = require('../models/Vehicle');
const CabFareRule = require('../models/CabFareRule');
const Hotel = require('../models/Hotel');
const Booking = require('../models/Booking');

// @desc    Onboard a new cab (Hotel-linked or Independent Agency Driver)
// @route   POST /api/hotel/cabs/onboard
// @access  Private (Provider)
exports.onboardHotelCab = async (req, res, next) => {
  try {
    const { driverDetails, vehicleDetails, fareSetup, serviceAreas } = req.body;

    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    let isCabAgency = user?.providerType === 'Cab';

    if (!isCabAgency) {
      const existingAgency = await CabVendor.findOne({ providerId: req.user.id, cabSourceType: 'INDEPENDENT' });
      if (existingAgency) isCabAgency = true;
    }

    let hotelId = null;
    let cabSourceType = isCabAgency ? 'INDEPENDENT' : 'HOTEL_LINKED';

    if (!isCabAgency) {
      const hotel = await Hotel.findOne({ providerId: req.user.id });
      if (!hotel) {
        return res.status(404).json({ success: false, message: 'Hotel not found for this provider.' });
      }
      hotelId = hotel._id;
    }

    // Check if vehicle is already registered
    const existingVehicle = await Vehicle.findOne({ 'details.registrationNumber': vehicleDetails.registrationNumber });
    if (existingVehicle) {
      return res.status(400).json({ success: false, message: 'Vehicle registration number already exists.' });
    }

    // 1. Create CabVendor (Driver Profile)
    const newCabVendor = await CabVendor.create({
      providerId: req.user.id,
      cabSourceType: cabSourceType,
      hotelId: hotelId,
      vendorDetails: {
        driverName: driverDetails.driverName,
        mobile: driverDetails.mobile,
        email: driverDetails.email || '',
        address: driverDetails.address,
        emergencyContact: driverDetails.emergencyContact,
        driverPhoto: driverDetails.driverPhoto // Cloudinary URL
      },
      documents: driverDetails.documents || {},
      serviceAreas: serviceAreas || []
    });

    // 2. Create Vehicle
    const newVehicle = await Vehicle.create({
      vendorId: newCabVendor._id,
      cabSourceType: cabSourceType,
      hotelId: hotelId,
      details: {
        vehicleType: vehicleDetails.vehicleType,
        model: vehicleDetails.model,
        year: vehicleDetails.year,
        registrationNumber: vehicleDetails.registrationNumber,
        seatingCapacity: vehicleDetails.seatingCapacity,
        luggageCapacity: vehicleDetails.luggageCapacity,
        isAC: vehicleDetails.isAC,
        fuelType: vehicleDetails.fuelType,
        color: vehicleDetails.color,
        photos: vehicleDetails.photos // Array of Cloudinary URLs
      },
      documents: vehicleDetails.documents || {}
    });

    // 3. Create Fare Rules
    if (fareSetup) {
      await CabFareRule.create({
        providerId: req.user.id,
        vehicleType: vehicleDetails.vehicleType,
        baseFare: fareSetup.baseFare || 0,
        perKmRate: fareSetup.perKmRate || 0,
        minimumFare: fareSetup.baseFare || 0,
        waitingCharge: fareSetup.waitingCharge || 0,
        nightCharge: fareSetup.nightCharge || 0,
        platformCommissionValue: 10 // Mock default
      });
    }

    res.status(201).json({
      success: true,
      message: 'Hotel-linked cab onboarding submitted for approval',
      data: { cabVendor: newCabVendor, vehicle: newVehicle }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all cabs linked to provider's hotel or agency
// @route   GET /api/hotel/cabs
// @access  Private (Provider)
exports.getHotelCabs = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    let isCabAgency = user?.providerType === 'Cab';

    if (!isCabAgency) {
      const existingAgency = await CabVendor.findOne({ providerId: req.user.id, cabSourceType: 'INDEPENDENT' });
      if (existingAgency) isCabAgency = true;
    }

    let cabs;
    if (isCabAgency) {
      cabs = await CabVendor.find({ providerId: req.user.id, cabSourceType: 'INDEPENDENT' });
    } else {
      const hotel = await Hotel.findOne({ providerId: req.user.id });
      if (!hotel) {
        return res.status(200).json({ success: true, cabs: [] });
      }
      cabs = await CabVendor.find({ hotelId: hotel._id, cabSourceType: 'HOTEL_LINKED' });
    }

    // Also fetch vehicles for these cabs
    const cabVendorIds = cabs.map(c => c._id);
    const vehicles = await Vehicle.find({ vendorId: { $in: cabVendorIds } });

    // Fetch fare rules for these vehicle types
    const CabFareRule = require('../models/CabFareRule');
    const vehicleTypes = [...new Set(vehicles.map(v => v.details?.vehicleType).filter(Boolean))];
    const fareRules = await CabFareRule.find({ providerId: req.user.id, vehicleType: { $in: vehicleTypes } });

    res.status(200).json({
      success: true,
      count: cabs.length,
      cabs,
      vehicles,
      fareRules
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get cab bookings for hotel-linked cabs and independent cabs
// @route   GET /api/hotel/cab-bookings
// @access  Private (Provider)
exports.getHotelCabBookings = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    const Hotel = require('../models/Hotel');
    
    let cabBookings = [];

    if (user.providerType === 'Cab') {
       // Independent Cab Agency
       const CabVendor = require('../models/CabVendor');
       const agencyVendors = await CabVendor.find({ providerId: req.user.id });
       const vendorIds = agencyVendors.map(v => v._id);

       cabBookings = await Booking.find({
          bookingType: 'CAB',
          $or: [
            {
              'cabBooking.cabSourceType': { $in: ['INDEPENDENT', 'AGENCY'] },
              'cabBooking.assignedCabProviderId': req.user.id
            },
            {
              'cabBooking.cabSourceType': 'INDEPENDENT',
              'cabBooking.status': { $in: ['requested', 'external_cabs_notified'] },
              'cabBooking.assignedCabProviderId': { $exists: false }
            }
          ]
       })
       .populate('userId', 'name email mobile')
       .populate('cabBooking.vendorId')
       .populate('cabBooking.vehicleId')
       .populate('cabBooking.hotelBookingId', 'hotelBooking.status');

    } else {
       // Hotel Provider
       const hotel = await Hotel.findOne({ providerId: req.user.id });
       if (!hotel) {
         return res.status(200).json({ success: true, count: 0, data: [] });
       }

       cabBookings = await Booking.find({
         bookingType: 'CAB',
         'cabBooking.hotelId': hotel._id,
         'cabBooking.cabSourceType': 'HOTEL_LINKED'
       })
       .populate('userId', 'name email mobile')
       .populate('cabBooking.vendorId')
       .populate('cabBooking.vehicleId')
       .populate('cabBooking.hotelBookingId', 'hotelBooking.status');
    }

    res.status(200).json({
      success: true,
      count: cabBookings.length,
      data: cabBookings
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteHotelCab = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    let isCabAgency = user?.providerType === 'Cab';

    if (!isCabAgency) {
      const existingAgency = await CabVendor.findOne({ providerId: req.user.id, cabSourceType: 'INDEPENDENT' });
      if (existingAgency) isCabAgency = true;
    }

    let cabVendor;
    if (isCabAgency) {
      cabVendor = await CabVendor.findOne({ _id: req.params.id, providerId: req.user.id, cabSourceType: 'INDEPENDENT' });
    } else {
      const hotel = await Hotel.findOne({ providerId: req.user.id });
      if (!hotel) {
        return res.status(404).json({ success: false, message: 'Hotel not found' });
      }
      cabVendor = await CabVendor.findOne({ _id: req.params.id, hotelId: hotel._id, cabSourceType: 'HOTEL_LINKED' });
    }

    if (!cabVendor) {
      return res.status(404).json({ success: false, message: 'Cab not found or unauthorized' });
    }

    // Delete associated vehicle
    await Vehicle.findOneAndDelete({ vendorId: cabVendor._id });
    // Delete cab vendor
    await CabVendor.findByIdAndDelete(cabVendor._id);

    res.status(200).json({ success: true, message: 'Cab deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.updateHotelCab = async (req, res, next) => {
  try {
    const { driverDetails, vehicleDetails, fareSetup } = req.body;

    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    let isCabAgency = user?.providerType === 'Cab';

    if (!isCabAgency) {
      const existingAgency = await CabVendor.findOne({ providerId: req.user.id, cabSourceType: 'INDEPENDENT' });
      if (existingAgency) isCabAgency = true;
    }

    let cabVendor;
    if (isCabAgency) {
      cabVendor = await CabVendor.findOne({ _id: req.params.id, providerId: req.user.id, cabSourceType: 'INDEPENDENT' });
    } else {
      const hotel = await Hotel.findOne({ providerId: req.user.id });
      if (!hotel) {
        return res.status(404).json({ success: false, message: 'Hotel not found' });
      }
      cabVendor = await CabVendor.findOne({ _id: req.params.id, hotelId: hotel._id, cabSourceType: 'HOTEL_LINKED' });
    }

    if (!cabVendor) {
      return res.status(404).json({ success: false, message: 'Cab not found or unauthorized' });
    }

    // Update CabVendor
    if (driverDetails) {
      if (driverDetails.driverName) cabVendor.vendorDetails.driverName = driverDetails.driverName;
      if (driverDetails.mobile) cabVendor.vendorDetails.mobile = driverDetails.mobile;
      if (driverDetails.email) cabVendor.vendorDetails.email = driverDetails.email;
      if (driverDetails.address) cabVendor.vendorDetails.address = driverDetails.address;
      if (driverDetails.driverPhoto) cabVendor.vendorDetails.driverPhoto = driverDetails.driverPhoto;
      await cabVendor.save();
    }

    // Update Vehicle
    if (vehicleDetails) {
      const vehicle = await Vehicle.findOne({ vendorId: cabVendor._id });
      if (vehicle) {
        if (vehicleDetails.vehicleType) vehicle.details.vehicleType = vehicleDetails.vehicleType;
        if (vehicleDetails.model) vehicle.details.model = vehicleDetails.model;
        if (vehicleDetails.registrationNumber) vehicle.details.registrationNumber = vehicleDetails.registrationNumber;
        if (vehicleDetails.photos && vehicleDetails.photos.length > 0) vehicle.details.photos = vehicleDetails.photos;
        await vehicle.save();
      }
    }

    // Update Fare Rules
    if (fareSetup && vehicleDetails && vehicleDetails.vehicleType) {
      let fareRule = await CabFareRule.findOne({ providerId: req.user.id, vehicleType: vehicleDetails.vehicleType });
      if (fareRule) {
        if (fareSetup.baseFare !== undefined) fareRule.baseFare = fareSetup.baseFare;
        if (fareSetup.perKmRate !== undefined) fareRule.perKmRate = fareSetup.perKmRate;
        await fareRule.save();
      } else {
        await CabFareRule.create({
          providerId: req.user.id,
          vehicleType: vehicleDetails.vehicleType,
          baseFare: fareSetup.baseFare || 0,
          perKmRate: fareSetup.perKmRate || 0,
          minimumFare: fareSetup.baseFare || 0
        });
      }
    }

    res.status(200).json({ success: true, message: 'Cab updated successfully' });
  } catch (error) {
    next(error);
  }
};

exports.assignCabBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { vendorId, vehicleId } = req.body;

    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    const Hotel = require('../models/Hotel');

    let booking;
    let vendor;

    if (user.providerType === 'Cab') {
      booking = await Booking.findOne({
        _id: id,
        bookingType: 'CAB',
        'cabBooking.cabSourceType': { $in: ['INDEPENDENT', 'AGENCY'] },
        'cabBooking.status': { $in: ['requested', 'external_cabs_notified'] }
      }).populate('cabBooking.hotelBookingId');

      if (!booking) {
        return res.status(404).json({ success: false, message: 'Cab booking request not found or already processed' });
      }

      vendor = await CabVendor.findOne({ _id: vendorId, providerId: req.user.id });
      if (!vendor) {
        return res.status(400).json({ success: false, message: 'Invalid cab vendor selected' });
      }

    } else {
      const hotel = await Hotel.findOne({ providerId: req.user.id });
      if (!hotel) {
        return res.status(404).json({ success: false, message: 'Hotel not found' });
      }

      booking = await Booking.findOne({
        _id: id,
        bookingType: 'CAB',
        'cabBooking.hotelId': hotel._id,
        'cabBooking.status': { $in: ['requested', 'hotel_cabs_notified'] }
      }).populate('cabBooking.hotelBookingId');

      if (!booking) {
        return res.status(404).json({ success: false, message: 'Cab booking request not found or already processed' });
      }

      vendor = await CabVendor.findOne({ _id: vendorId, hotelId: hotel._id });
      if (!vendor) {
        return res.status(400).json({ success: false, message: 'Invalid cab vendor selected' });
      }
    }

    if (booking.cabBooking?.hotelBookingId && booking.cabBooking.hotelBookingId.hotelBooking?.status === 'pending_approval') {
      return res.status(400).json({ success: false, message: 'Cannot assign a cab until the associated hotel booking is approved.' });
    }

    booking.cabBooking.status = 'assigned';
    booking.cabBooking.vendorId = vendorId;
    booking.cabBooking.assignedCabProviderId = req.user.id;
    booking.cabBooking.vehicleId = vehicleId;
    booking.cabBooking.acceptedAt = new Date();
    if (!booking.cabBooking.otp) {
      booking.cabBooking.otp = Math.floor(100000 + Math.random() * 900000).toString();
    }

    await booking.save();

    // Make the vendor unavailable
    vendor.availability.isAvailable = false;
    await vendor.save();

    // Notify Driver (if they are online)
    const io = req.app.get('io');
    if (io) {
      if (vendor.driverId) {
        io.to(`provider_${vendor.driverId.toString()}`).emit('ride_assigned', {
          bookingId: booking._id,
          pickupLocation: booking.cabBooking.pickupLocation,
          dropLocation: booking.cabBooking.dropLocation
        });
      }
      if (vendor.providerId) {
        io.to(`provider_${vendor.providerId.toString()}`).emit('ride_assigned', {
          bookingId: booking._id,
          pickupLocation: booking.cabBooking.pickupLocation,
          dropLocation: booking.cabBooking.dropLocation
        });
      }
      // Also notify customer
      if (booking.userId) {
        io.to(`user_${booking.userId.toString()}`).emit('ride_accepted', {
          bookingId: booking._id,
          driverInfo: vendor.vendorDetails
        });
      }
    }

    res.status(200).json({ success: true, message: 'Cab successfully assigned', booking });
  } catch (error) {
    next(error);
  }
};

exports.verifyCabOTP = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;

    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    let isCabAgency = user?.providerType === 'Cab';

    let booking;
    if (isCabAgency) {
      booking = await Booking.findOne({
        _id: id,
        bookingType: 'CAB',
        'cabBooking.assignedCabProviderId': req.user.id,
      });
    } else {
      const hotel = await Hotel.findOne({ providerId: req.user.id });
      if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });

      booking = await Booking.findOne({
        _id: id,
        bookingType: 'CAB',
        'cabBooking.hotelId': hotel._id,
      });
    }

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found or unauthorized' });

    if (booking.cabBooking.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    booking.cabBooking.status = 'trip_started';
    booking.cabBooking.startedAt = new Date();
    booking.cabBooking.statusLogs.push({
      status: 'trip_started',
      timestamp: new Date()
    });

    await booking.save();

    res.status(200).json({ success: true, message: 'OTP verified. Trip started.', booking });
  } catch (error) {
    next(error);
  }
};

exports.updateCabStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    let isCabAgency = user?.providerType === 'Cab';

    let booking;
    if (isCabAgency) {
      booking = await Booking.findOne({
        _id: id,
        bookingType: 'CAB',
        $or: [
          { 'cabBooking.assignedCabProviderId': req.user.id },
          { 'cabBooking.status': { $in: ['requested', 'external_cabs_notified'] } }
        ]
      });
    } else {
      const hotel = await Hotel.findOne({ providerId: req.user.id });
      if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });

      booking = await Booking.findOne({
        _id: id,
        bookingType: 'CAB',
        'cabBooking.hotelId': hotel._id,
      });
    }

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found or unauthorized' });

    booking.cabBooking.status = status;
    booking.cabBooking.statusLogs.push({
      status: status,
      timestamp: new Date()
    });

    if (status === 'completed') {
      booking.cabBooking.completedAt = new Date();
      
      let vendorId = booking.cabBooking.vendorId;
      let vendor = null;
      if (vendorId) {
        vendor = await CabVendor.findById(vendorId);
        if (vendor) {
          vendor.availability.isAvailable = true;
          await vendor.save();
        }
      }

      // Generate Platform Fee if not already present
      const PlatformFee = require('../models/PlatformFee');
      const existingFee = await PlatformFee.findOne({ bookingId: booking._id });
      if (!existingFee) {
        const platformFeeAmount = booking.cabBooking.fareSnapshot?.platformFee || ((booking.totalAmount * 10) / 100);
        const driverEarningAmount = booking.cabBooking.fareSnapshot?.providerEarning || (booking.totalAmount - platformFeeAmount);
        
        booking.platformCommission = platformFeeAmount;
        booking.partnerEarning = driverEarningAmount;

        if (booking.paymentMode === 'cod' || booking.paymentMode === 'pay_at_hotel') {
          booking.paymentStatus = 'cod_collected';
          booking.codCollectedBy = vendor ? vendor._id : vendorId;
          booking.codCollectedAt = new Date();
        }

        await PlatformFee.create({
          bookingId: booking._id,
          providerId: isCabAgency ? req.user.id : (vendor ? vendor.providerId : vendorId),
          cabProviderId: vendorId,
          driverId: vendor ? vendor.driverId : vendorId,
          hotelId: isCabAgency ? null : (hotel ? hotel._id : null),
          grossFare: booking.totalAmount,
          platformFee: platformFeeAmount,
          driverEarning: driverEarningAmount,
          feeStatus: 'payable'
        });
      }
    }

    await booking.save();

    res.status(200).json({ success: true, message: `Cab status updated to ${status}`, booking });
  } catch (error) {
    next(error);
  }
};

exports.getAllAvailableCabs = async (req, res, next) => {
  try {
    const CabVendor = require('../models/CabVendor');
    const Vehicle = require('../models/Vehicle');
    const cabs = await CabVendor.find({ status: 'approved' });
    const cabVendorIds = cabs.map(c => c._id);
    const vehicles = await Vehicle.find({ vendorId: { $in: cabVendorIds } });
    
    res.status(200).json({
      success: true,
      cabs,
      vehicles
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
