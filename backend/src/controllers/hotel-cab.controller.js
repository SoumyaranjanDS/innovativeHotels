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

// @desc    Get cab bookings for hotel-linked cabs
// @route   GET /api/hotel/cab-bookings
// @access  Private (Provider)
exports.getHotelCabBookings = async (req, res, next) => {
  try {
    const hotel = await Hotel.findOne({ providerId: req.user.id });
    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }

    const cabBookings = await Booking.find({
      bookingType: 'CAB',
      'cabBooking.hotelId': hotel._id,
      'cabBooking.cabSourceType': 'HOTEL_LINKED'
    }).populate('userId', 'name email').populate('cabBooking.vendorId').populate('cabBooking.vehicleId');

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

    const hotel = await Hotel.findOne({ providerId: req.user.id });
    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }

    const booking = await Booking.findOne({
      _id: id,
      bookingType: 'CAB',
      'cabBooking.hotelId': hotel._id,
      'cabBooking.status': 'requested'
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Cab booking request not found or already processed' });
    }

    // Verify vendor belongs to this hotel
    const vendor = await CabVendor.findOne({ _id: vendorId, hotelId: hotel._id });
    if (!vendor) {
      return res.status(400).json({ success: false, message: 'Invalid cab vendor selected' });
    }

    booking.cabBooking.status = 'assigned';
    booking.cabBooking.vendorId = vendorId;
    booking.cabBooking.assignedCabProviderId = vendorId;
    booking.cabBooking.vehicleId = vehicleId;
    booking.cabBooking.acceptedAt = new Date();

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
