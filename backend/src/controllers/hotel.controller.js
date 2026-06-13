const Hotel = require('../models/Hotel');
const HotelAvailability = require('../models/HotelAvailability');
const BookingHold = require('../models/BookingHold');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

exports.searchHotels = async (req, res) => {
  try {
    const { city, checkIn, checkOut, guests } = req.query;
    
    // For MVP, if no specific query, just return all available hotels with their rooms
    // We'll populate rooms to easily grab hotelId and roomId in the frontend
    const hotels = await Hotel.find({ isApproved: true })
      .select('profile.hotelName partnerDetails.city profile.starRating profile.description profile.photos');
    
    // Get rooms for these hotels
    const hotelsWithRooms = await Promise.all(hotels.map(async (h) => {
      const rooms = await Room.find({ hotelId: h._id });
      const obj = h.toObject();
      return { 
        ...obj, 
        hotelName: obj.profile?.hotelName || 'Unknown Hotel', 
        city: obj.partnerDetails?.city || 'Unknown City',
        rooms 
      };
    }));

    res.json({ success: true, data: hotelsWithRooms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.holdRoom = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { hotelId, roomId, checkInDate, checkOutDate, roomsCount, guests } = req.body;
    
    // Calculate dates array (excluding checkout date as per rule)
    const dates = [];
    let currentDate = new Date(checkInDate);
    const end = new Date(checkOutDate);
    while (currentDate < end) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    let totalBasePrice = 0;

    for (const date of dates) {
      // Find availability for this date
      const availability = await HotelAvailability.findOne({ hotelId, roomId, date }).session(session);
      
      if (!availability) {
        throw new Error(`Availability not configured for ${date.toISOString()}`);
      }

      if (availability.isBlocked) {
        throw new Error(`Room blocked for ${date.toISOString()}`);
      }

      // Atomic check: totalRooms - bookedRooms - heldRooms >= roomsCount
      const availableCount = availability.totalRooms - availability.bookedRooms - availability.heldRooms;
      if (availableCount < roomsCount) {
         throw new Error('Sorry, this room is no longer available for the selected dates.');
      }

      // Update heldRooms atomically
      await HotelAvailability.updateOne(
        { _id: availability._id, $expr: { $gte: [{ $subtract: ["$totalRooms", { $add: ["$bookedRooms", "$heldRooms"] }] }, roomsCount] } },
        { $inc: { heldRooms: roomsCount } },
        { session }
      );
      
      totalBasePrice += availability.finalPrice * roomsCount;
    }

    // Create the hold record
    const holdCode = uuidv4();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes hold

    const newHold = await BookingHold.create([{
      holdCode,
      userId: req.user.id,
      hotelId,
      roomId,
      checkInDate,
      checkOutDate,
      dates,
      roomsCount,
      guests,
      priceSnapshot: {
        basePrice: totalBasePrice,
        taxAmount: totalBasePrice * 0.18, // example tax
        discountAmount: 0,
        totalPrice: totalBasePrice * 1.18
      },
      expiresAt
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ success: true, message: 'Room held successfully', hold: newHold[0] });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.confirmBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { holdId, guestDetails, paymentMethod } = req.body;
    
    // Find the hold
    const hold = await BookingHold.findById(holdId).session(session);
    if (!hold) {
      throw new Error('Hold record not found');
    }

    // Check if expired
    if (new Date() > hold.expiresAt) {
      throw new Error('This booking hold has expired. Please search again.');
    }

    // Create the final booking
    const bookingCode = `BKG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    const booking = await Booking.create([{
      bookingCode,
      userId: hold.userId,
      providerId: hold.hotelId, // Dummy map for MVP
      serviceType: 'Hotel',
      serviceId: hold.roomId,
      dates: { checkIn: hold.checkInDate, checkOut: hold.checkOutDate },
      payment: {
        totalAmount: hold.priceSnapshot.totalPrice,
        status: 'completed', // Assuming successful mock payment
        method: paymentMethod || 'credit_card'
      },
      status: 'confirmed',
      guestDetails: guestDetails || hold.guests
    }], { session });

    // Update availability (deduct from heldRooms, add to bookedRooms)
    for (const date of hold.dates) {
      await HotelAvailability.updateOne(
        { hotelId: hold.hotelId, roomId: hold.roomId, date: date },
        { 
          $inc: { heldRooms: -hold.roomsCount, bookedRooms: hold.roomsCount }
        },
        { session }
      );
    }

    // Remove the hold record
    await BookingHold.findByIdAndDelete(holdId).session(session);

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ success: true, message: 'Booking confirmed successfully!', booking: booking[0] });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ success: false, message: error.message });
  }
};
