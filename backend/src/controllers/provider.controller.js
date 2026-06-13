const ProviderProfile = require('../models/ProviderProfile');
const Hotel = require('../models/Hotel');
const Room = require('../models/Room');

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

exports.addHotelService = async (req, res) => {
  try {
    const profile = await ProviderProfile.findOne({ userId: req.user.id });
    if (!profile) return res.status(404).json({ success: false, message: 'Provider profile not found' });
    
    // Create the Hotel document
    const hotel = await Hotel.create({
      providerId: req.user.id,
      partnerDetails: {
        ownerName: profile.companyName || 'Unknown Owner',
        mobile: profile.contactNumber || ''
      },
      profile: {
        hotelName: `${profile.companyName} Hotel` || 'New Hotel',
        category: 'Standard',
        starRating: 3
      },
      isApproved: false // Requires Admin Approval
    });

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

exports.addCabService = async (req, res) => {
  try {
    const profile = await ProviderProfile.findOne({ userId: req.user.id });
    if (!profile) return res.status(404).json({ success: false, message: 'Provider profile not found' });
    
    // In a real app, you would create the CabVendor document here
    profile.cabService.status = 'pending_review';
    await profile.save();

    res.status(200).json({ success: true, message: 'Cab service added', profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
