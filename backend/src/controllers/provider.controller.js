const ProviderProfile = require('../models/ProviderProfile');
const Hotel = require('../models/Hotel');
const HotelAvailability = require('../models/HotelAvailability');
const Room = require('../models/Room');
const CabVendor = require('../models/CabVendor');
const Booking = require('../models/Booking');
const Review = require('../models/Review');

exports.getProviderStatus = async (req, res) => {
  try {
    let profile = await ProviderProfile.findOne({ userId: req.user.id });
    if (!profile) {
      profile = await ProviderProfile.create({ userId: req.user.id });
    }
    res.status(200).json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.setProviderType = async (req, res) => {
  try {
    const { providerType } = req.body;
    if (!['Hotel', 'Cab'].includes(providerType)) {
      return res.status(400).json({ success: false, message: 'Invalid provider type' });
    }
    
    const User = require('../models/User');
    const user = await User.findByIdAndUpdate(req.user.id, { providerType }, { new: true });
    
    res.json({ success: true, user: { id: user._id, name: user.name, email: user.email, role: user.role, providerType: user.providerType } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProviderMetrics = async (req, res) => {
  try {
    const Booking = require('../models/Booking');
    const Hotel = require('../models/Hotel');
    const CabVendor = require('../models/CabVendor');

    let totalRevenue = 0;
    let activeBookings = 0;
    let pendingRequests = 0;

    // We can fetch provider's hotel and cab vendor
    const hotel = await Hotel.findOne({ providerId: req.user.id });
    const cabVendor = await CabVendor.findOne({ providerId: req.user.id, cabSourceType: 'INDEPENDENT' });

    let queryOr = [];
    if (hotel) {
      queryOr.push({ 'hotelBooking.hotelId': hotel._id });
      queryOr.push({ 'cabBooking.hotelId': hotel._id });
    }
    if (cabVendor) {
      queryOr.push({ 'cabBooking.vendorId': cabVendor._id });
    }

    if (queryOr.length > 0) {
      const bookings = await Booking.find({ $or: queryOr });
      
      bookings.forEach(b => {
        if (b.bookingType === 'HOTEL') {
          if (b.hotelBooking.status === 'confirmed' || b.hotelBooking.status === 'checked_in') activeBookings++;
          if (b.hotelBooking.status === 'pending') pendingRequests++;
          if (b.paymentStatus === 'paid') totalRevenue += (b.partnerEarning || 0);
        } else if (b.bookingType === 'CAB') {
          if (b.cabBooking.status === 'assigned' || b.cabBooking.status === 'on_the_way' || b.cabBooking.status === 'trip_started') activeBookings++;
          if (b.cabBooking.status === 'requested') pendingRequests++;
          if (b.paymentStatus === 'paid' || b.paymentStatus === 'cod_collected') totalRevenue += (b.partnerEarning || 0);
        }
      });
    }

    res.status(200).json({
      success: true,
      metrics: {
        totalRevenue: totalRevenue.toFixed(2),
        activeBookings,
        pendingRequests
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addHotelService = async (req, res) => {
  try {
    const profile = await ProviderProfile.findOne({ userId: req.user.id });
    if (!profile) return res.status(404).json({ success: false, message: 'Provider profile not found' });
    
    let hotel = await Hotel.findOne({ providerId: req.user.id });
    
    if (hotel) {
      if (hotel.status === 'rejected') {
        // Reapply logic
        hotel.status = 'pending';
        hotel.rejectionReason = '';
        hotel.isApproved = false;
        
        // Update fields
        hotel.partnerDetails.ownerName = req.body.ownerName || hotel.partnerDetails.ownerName;
        hotel.partnerDetails.mobile = req.body.contactNumber || hotel.partnerDetails.mobile;
        hotel.partnerDetails.email = req.body.email || hotel.partnerDetails.email;
        if (req.body.address) {
          hotel.partnerDetails.address = req.body.address.street || hotel.partnerDetails.address;
          hotel.partnerDetails.city = req.body.address.city || hotel.partnerDetails.city;
          hotel.partnerDetails.state = req.body.address.state || hotel.partnerDetails.state;
          hotel.partnerDetails.country = req.body.address.country || hotel.partnerDetails.country;
        }
        
        hotel.profile.hotelName = req.body.name || hotel.profile.hotelName;
        hotel.profile.description = req.body.description || hotel.profile.description;
        if (req.body.propertyPhoto) {
           hotel.documents.propertyPhotos = [req.body.propertyPhoto];
        }

        await hotel.save();
      } else {
        return res.status(400).json({ success: false, message: 'Hotel onboarding already submitted' });
      }
    } else {
      // Create the Hotel document
      hotel = await Hotel.create({
        providerId: req.user.id,
        partnerDetails: {
          ownerName: req.body.ownerName || profile.companyName || 'Unknown Owner',
          mobile: req.body.contactNumber || profile.contactNumber || '',
          email: req.body.email || '',
          address: req.body.address?.street || '',
          city: req.body.address?.city || '',
          state: req.body.address?.state || '',
          country: req.body.address?.country || ''
        },
        profile: {
          hotelName: req.body.name || (profile.companyName ? `${profile.companyName} Hotel` : 'New Hotel'),
          description: req.body.description || '',
          category: 'Standard',
          starRating: 3
        },
        documents: {
          propertyPhotos: req.body.propertyPhoto ? [req.body.propertyPhoto] : []
        },
        isApproved: false,
        status: 'pending'
      });
    }

    profile.hotelService.status = 'pending_review';
    await profile.save();

    res.status(200).json({ success: true, message: 'Hotel service submitted for review', profile, hotel });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProviderHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ providerId: req.user.id });
    res.status(200).json({ success: true, hotel });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addRoom = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ providerId: req.user.id });
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });
    if (!hotel.isApproved) return res.status(403).json({ success: false, message: 'Hotel not yet approved' });

    const room = await Room.create({
      hotelId: hotel._id,
      ...req.body
    });

    res.status(201).json({ success: true, message: 'Room added successfully', room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRooms = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ providerId: req.user.id });
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });

    const rooms = await Room.find({ hotelId: hotel._id });
    res.status(200).json({ success: true, rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteRoom = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ providerId: req.user.id });
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });

    const room = await Room.findOneAndDelete({ _id: req.params.id, hotelId: hotel._id });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found or unauthorized' });

    res.status(200).json({ success: true, message: 'Room deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateRoom = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ providerId: req.user.id });
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });

    const room = await Room.findOneAndUpdate(
      { _id: req.params.id, hotelId: hotel._id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!room) return res.status(404).json({ success: false, message: 'Room not found or unauthorized' });

    res.status(200).json({ success: true, message: 'Room updated successfully', room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addCabService = async (req, res) => {
  try {
    const profile = await ProviderProfile.findOne({ userId: req.user.id });
    if (!profile) return res.status(404).json({ success: false, message: 'Provider profile not found' });
    
    // Create CabVendor document for INDEPENDENT cab
    const CabVendor = require('../models/CabVendor');
    let existingCab = await CabVendor.findOne({ providerId: req.user.id, cabSourceType: 'INDEPENDENT' });
    
    if (existingCab) {
      if (existingCab.status === 'rejected') {
        existingCab.status = 'pending';
        existingCab.rejectionReason = '';
        existingCab.isApproved = false;
        
        // Update documents if provided
        if (req.body.documents) {
          existingCab.vendorDetails.driverPhoto = req.body.documents.driverPhoto || existingCab.vendorDetails.driverPhoto;
          existingCab.documents.drivingLicense = req.body.documents.drivingLicense || existingCab.documents.drivingLicense;
          existingCab.documents.driverId = req.body.documents.driverId || existingCab.documents.driverId;
        }

        await existingCab.save();
        
        if (req.body.vehicleDetails) {
          const Vehicle = require('../models/Vehicle');
          let existingVehicle = await Vehicle.findOne({ vendorId: existingCab._id });
          if (existingVehicle) {
            existingVehicle.details = req.body.vehicleDetails;
            existingVehicle.documents = req.body.vehicleDocuments || existingVehicle.documents;
            await existingVehicle.save();
          } else {
            await Vehicle.create({
              vendorId: existingCab._id,
              cabSourceType: 'INDEPENDENT',
              details: req.body.vehicleDetails,
              documents: req.body.vehicleDocuments || {}
            });
          }
        }

      } else {
        return res.status(400).json({ success: false, message: 'Independent Cab onboarding already submitted' });
      }
    } else {
      let newCabVendor = await CabVendor.create({
        providerId: req.user.id,
        cabSourceType: 'INDEPENDENT',
        vendorDetails: {
          driverName: profile.companyName || 'Independent Driver',
          mobile: profile.contactNumber || '',
          driverPhoto: req.body.documents?.driverPhoto || ''
        },
        documents: {
          drivingLicense: req.body.documents?.drivingLicense || '',
          driverId: req.body.documents?.driverId || ''
        },
        status: 'pending',
        isApproved: false
      });

      if (req.body.vehicleDetails) {
        const Vehicle = require('../models/Vehicle');
        await Vehicle.create({
          vendorId: newCabVendor._id,
          cabSourceType: 'INDEPENDENT',
          details: req.body.vehicleDetails,
          documents: req.body.vehicleDocuments || {}
        });
      }
    }

    profile.cabService.status = 'pending_review';
    await profile.save();

    res.status(200).json({ success: true, message: 'Independent Cab service onboarding initiated', profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProviderHotelBookings = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ providerId: req.user.id });
    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }

    const Booking = require('../models/Booking');
    // Fetch all bookings where bookingType is HOTEL and hotelId matches
    const bookings = await Booking.find({
      bookingType: 'HOTEL',
      'hotelBooking.hotelId': hotel._id
    }).sort({ createdAt: -1 }).populate('userId', 'name email');

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateHotelBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    
    if (!['confirmed', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status update.' });
    }

    const hotel = await Hotel.findOne({ providerId: req.user.id });
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });

    const Booking = require('../models/Booking');
    const booking = await Booking.findOne({
      _id: id,
      bookingType: 'HOTEL',
      'hotelBooking.hotelId': hotel._id
    });

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    
    if (booking.hotelBooking.status !== 'pending_approval') {
      return res.status(400).json({ success: false, message: 'Only pending_approval bookings can be updated here.' });
    }

    if (status === 'confirmed') {
      booking.hotelBooking.status = 'confirmed';
    } else if (status === 'rejected') {
      booking.hotelBooking.status = 'rejected';
      booking.hotelBooking.rejectionReason = reason || 'Rejected by hotel';
      
      // Release inventory
      const HotelAvailability = require('../models/HotelAvailability');
      for (const date of booking.hotelBooking.dates) {
        await HotelAvailability.updateOne(
          { hotelId: booking.hotelBooking.hotelId, roomId: booking.hotelBooking.roomId, date },
          { $inc: { bookedRooms: -booking.hotelBooking.roomsCount } }
        );
      }

      // Handle refund if paid
      if (booking.paymentStatus === 'paid') {
        booking.paymentStatus = 'refund_initiated';
      }
    }

    await booking.save();
    res.status(200).json({ success: true, message: `Booking ${status} successfully.`, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get reviews for provider's hotels
// @route   GET /api/provider/reviews
exports.getProviderReviews = async (req, res) => {
  try {
    const hotels = await Hotel.find({ providerId: req.user.id });
    if (hotels.length === 0) {
      return res.json({ success: true, reviews: [] });
    }
    
    const hotelIds = hotels.map(h => h._id);
    const reviews = await Review.find({ hotelId: { $in: hotelIds } })
      .populate('userId', 'name')
      .populate('hotelId', 'profile.hotelName')
      .sort({ createdAt: -1 });
      
    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
