const Booking = require('../models/Booking');

exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    // Optional: add authorization check to ensure the user owns the booking or is admin/driver
    // if (booking.userId.toString() !== req.user.id) { ... }

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const CabVendor = require('../models/CabVendor');
const Vehicle = require('../models/Vehicle');
const Hotel = require('../models/Hotel');
const CabFareRule = require('../models/CabFareRule');
const { Client } = require("@googlemaps/google-maps-services-js");
const { v4: uuidv4 } = require('uuid');

const mapsClient = new Client({});

exports.getCabSuggestions = async (req, res) => {
  try {
    const hotelBookingId = req.params.id;
    const booking = await Booking.findById(hotelBookingId);
    
    if (!booking || booking.bookingType !== 'HOTEL') {
      return res.status(404).json({ success: false, message: 'Hotel booking not found.' });
    }

    const hotelId = booking.hotelBooking.hotelId;
    
    // 1. Look for Hotel-linked cabs
    const hotelLinkedCabs = await CabVendor.find({
      hotelId: hotelId,
      cabSourceType: 'HOTEL_LINKED',
      'availability.isOnline': true,
      serviceStatus: 'active'
    });

    const vendorIds = hotelLinkedCabs.map(c => c._id);
    const hotelVehicles = await Vehicle.find({ vendorId: { $in: vendorIds } });

    res.status(200).json({
      success: true,
      hasHotelLinkedCabs: hotelLinkedCabs.length > 0,
      hotelLinkedCabs,
      vehicles: hotelVehicles,
      hotelId: hotelId
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.bookCab = async (req, res) => {
  try {
    const { 
      pickupLocation, 
      dropLocation, 
      pickupDateTime, 
      passengers, 
      luggageCount, 
      vehicleType, 
      hotelBookingId,
      cabSourcePreference,
      hotelId
    } = req.body;

    let distanceKm = req.body.distanceKm || 10;
    let durationMinutes = req.body.durationMinutes || 30;

    // Use Google Maps API if locations are provided
    if (pickupLocation?.address && dropLocation?.address && process.env.GOOGLE_API_KEY) {
      try {
        const response = await mapsClient.distancematrix({
          params: {
            origins: [pickupLocation.address],
            destinations: [dropLocation.address],
            key: process.env.GOOGLE_API_KEY
          }
        });
        
        if (response.data.rows[0].elements[0].status === 'OK') {
          distanceKm = response.data.rows[0].elements[0].distance.value / 1000;
          durationMinutes = Math.round(response.data.rows[0].elements[0].duration.value / 60);
        }
      } catch (mapError) {
        console.error('Google Maps API Error:', mapError.response ? mapError.response.data : mapError.message);
        // Fallback to provided defaults if API fails
      }
    }

    // Mock Fare Calculation
    const baseFare = 50;
    const perKmRate = 12;
    const totalAmount = baseFare + (distanceKm * perKmRate);

    const bookingId = 'CAB-' + uuidv4().substring(0, 8).toUpperCase();

    const newBooking = await Booking.create({
      bookingId,
      userId: req.user.id,
      bookingType: 'CAB',
      paymentMode: 'cod',
      paymentStatus: 'cod_pending',
      totalAmount: Math.round(totalAmount),
      cabBooking: {
        pickupLocation,
        dropLocation,
        pickupDateTime,
        passengers,
        luggageCount,
        vehicleType,
        cabSourcePreference: cabSourcePreference || 'ANY',
        cabSourceType: cabSourcePreference === 'HOTEL_LINKED' ? 'HOTEL_LINKED' : 'INDEPENDENT',
        hotelBookingId,
        hotelId,
        distanceKm,
        durationMinutes,
        fareSnapshot: {
          baseFare,
          distanceFare: distanceKm * perKmRate,
          timeFare: 0,
          taxAmount: 0
        },
        status: 'requested'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Cab booked successfully',
      booking: newBooking
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
