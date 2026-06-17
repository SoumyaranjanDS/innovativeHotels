const Hotel = require('../models/Hotel');
const HotelAvailability = require('../models/HotelAvailability');
const BookingHold = require('../models/BookingHold');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Review = require('../models/Review');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Helper: get stay dates (excludes checkout date)
const getStayDates = (checkIn, checkOut) => {
  const dates = [];
  let current = new Date(checkIn);
  current.setHours(0, 0, 0, 0);
  const end = new Date(checkOut);
  end.setHours(0, 0, 0, 0);
  while (current < end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

// @desc    Search hotels (public)
// @route   GET /api/hotels/search
exports.searchHotels = async (req, res) => {
  try {
    const { city, checkIn, checkOut, guests, rooms } = req.query;

    const filter = { isApproved: true, status: 'approved' };
    if (city) {
      filter['partnerDetails.city'] = { $regex: city, $options: 'i' };
    }

    const hotels = await Hotel.find(filter)
      .select('profile partnerDetails documents');

    const hotelsWithRooms = await Promise.all(hotels.map(async (h) => {
      const hotelRooms = await Room.find({ hotelId: h._id });
      const obj = h.toObject();

      // Get reviews for avg rating
      const reviews = await Review.find({ hotelId: h._id, status: 'approved' });
      const avgRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : null;

      // Check availability if dates provided
      let availableRooms = hotelRooms;
      if (checkIn && checkOut) {
        const stayDates = getStayDates(checkIn, checkOut);
        const roomsNeeded = parseInt(rooms) || 1;

        availableRooms = [];
        for (const room of hotelRooms) {
          let isAvailable = true;
          for (const date of stayDates) {
            const avail = await HotelAvailability.findOne({
              hotelId: h._id, roomId: room._id, date
            });
            if (avail) {
              if (avail.isBlocked || (avail.totalRooms - avail.bookedRooms - avail.heldRooms) < roomsNeeded) {
                isAvailable = false;
                break;
              }
            } else {
              // If no availability record exists, it means 0 bookings/holds.
              if (room.totalRooms < roomsNeeded) {
                isAvailable = false;
                break;
              }
            }
          }
          if (isAvailable) availableRooms.push(room);
        }
      }

      // Filter by guest capacity
      if (guests) {
        const guestCount = parseInt(guests);
        availableRooms = availableRooms.filter(r => r.occupancy >= guestCount);
      }

      const startingPrice = availableRooms.length > 0
        ? Math.min(...availableRooms.map(r => r.price))
        : null;

      return {
        _id: obj._id,
        hotelName: obj.profile?.hotelName || 'Unknown Hotel',
        city: obj.partnerDetails?.city || 'Unknown City',
        state: obj.partnerDetails?.state || '',
        address: obj.partnerDetails?.address || '',
        category: obj.profile?.category || '',
        starRating: obj.profile?.starRating || 0,
        description: obj.profile?.description || '',
        amenities: obj.profile?.amenities || [],
        checkInTime: obj.profile?.checkInTime || '14:00',
        checkOutTime: obj.profile?.checkOutTime || '11:00',
        cancellationPolicy: obj.policies?.cancellation || 'Standard cancellation policy',
        photos: obj.documents?.propertyPhotos || [],
        rooms: availableRooms,
        startingPrice,
        avgRating,
        reviewCount: reviews.length,
      };
    }));

    // Filter out hotels with no available rooms when dates are provided
    const filtered = (checkIn && checkOut)
      ? hotelsWithRooms.filter(h => h.rooms.length > 0)
      : hotelsWithRooms;

    res.json({ success: true, count: filtered.length, data: filtered });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get hotel detail (public)
// @route   GET /api/hotels/:id
exports.getHotelDetail = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ _id: req.params.id, isApproved: true, status: 'approved' });
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });

    const rooms = await Room.find({ hotelId: hotel._id });
    const reviews = await Review.find({ hotelId: hotel._id, status: 'approved' })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(20);

    const avgRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

    const { checkIn, checkOut, rooms: roomsNeeded } = req.query;
    let roomsWithAvailability = rooms.map(r => ({ ...r.toObject(), available: true, availableCount: r.totalRooms }));

    if (checkIn && checkOut) {
      const stayDates = getStayDates(checkIn, checkOut);
      const needed = parseInt(roomsNeeded) || 1;

      roomsWithAvailability = await Promise.all(rooms.map(async (room) => {
        let minAvailable = room.totalRooms;
        let available = true;
        let pricePerNight = room.price;

        for (const date of stayDates) {
          const avail = await HotelAvailability.findOne({
            hotelId: hotel._id, roomId: room._id, date
          });
          if (avail) {
            if (avail.isBlocked) {
              available = false;
              minAvailable = 0;
              break;
            }
            const free = avail.totalRooms - avail.bookedRooms - avail.heldRooms;
            if (free < needed) available = false;
            minAvailable = Math.min(minAvailable, free);
            pricePerNight = avail.finalPrice || room.price;
          } else {
            // No record means fully available
            if (room.totalRooms < needed) available = false;
            minAvailable = Math.min(minAvailable, room.totalRooms);
          }
        }

        return {
          ...room.toObject(),
          available,
          availableCount: Math.max(0, minAvailable),
          pricePerNight,
          nights: stayDates.length,
        };
      }));
    }

    const obj = hotel.toObject();
    res.json({
      success: true,
      data: {
        _id: obj._id,
        hotelName: obj.profile?.hotelName || 'Unknown Hotel',
        city: obj.partnerDetails?.city || '',
        state: obj.partnerDetails?.state || '',
        address: obj.partnerDetails?.address || '',
        category: obj.profile?.category || '',
        starRating: obj.profile?.starRating || 0,
        description: obj.profile?.description || '',
        amenities: obj.profile?.amenities || [],
        nearbyPlaces: obj.profile?.nearbyPlaces || [],
        checkInTime: obj.profile?.checkInTime || '14:00',
        checkOutTime: obj.profile?.checkOutTime || '11:00',
        policies: obj.policies || {},
        photos: obj.documents?.propertyPhotos || [],
        rooms: roomsWithAvailability,
        avgRating,
        reviewCount: reviews.length,
        reviews,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Check room availability
// @route   POST /api/hotels/:id/check-availability
exports.checkAvailability = async (req, res) => {
  try {
    const { roomId, checkIn, checkOut, roomsCount } = req.body;
    const hotelId = req.params.id;
    const needed = parseInt(roomsCount) || 1;
    const stayDates = getStayDates(checkIn, checkOut);

    if (stayDates.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid date range' });
    }

    let totalPrice = 0;
    let available = true;

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    for (const date of stayDates) {
      const avail = await HotelAvailability.findOne({ hotelId, roomId, date });
      if (avail) {
        if (avail.isBlocked) {
          available = false;
          break;
        }
        const free = avail.totalRooms - avail.bookedRooms - avail.heldRooms;
        if (free < needed) {
          available = false;
          break;
        }
        totalPrice += avail.finalPrice * needed;
      } else {
        if (room.totalRooms < needed) {
          available = false;
          break;
        }
        totalPrice += room.price * needed;
      }
    }

    // Room is already fetched above
    const taxAmount = Math.round(totalPrice * (room?.taxPercent || 18) / 100);
    const discountAmount = Math.round(totalPrice * (room?.discountPercent || 0) / 100);

    res.json({
      success: true,
      available,
      nights: stayDates.length,
      roomsCount: needed,
      basePrice: totalPrice,
      taxAmount,
      discountAmount,
      totalPrice: totalPrice + taxAmount - discountAmount,
      pricePerNight: stayDates.length > 0 ? Math.round(totalPrice / stayDates.length / needed) : 0,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Hold room for booking
// @route   POST /api/hotels/hold
exports.holdRoom = async (req, res) => {
  const maxRetries = 3;
  let attempt = 1;
  const { hotelId, roomId, checkInDate, checkOutDate, roomsCount, guests } = req.body;

  while (attempt <= maxRetries) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const needed = parseInt(roomsCount) || 1;

      // Validate room belongs to hotel
      const room = await Room.findOne({ _id: roomId, hotelId });
      if (!room) throw new Error('Room not found for this hotel');

      const dates = getStayDates(checkInDate, checkOutDate);
      if (dates.length === 0) throw new Error('Invalid date range');

      // PRE-INITIALIZE AVAILABILITY DOCUMENTS OUTSIDE THE TRANSACTION
      // Doing upserts inside a multi-document transaction causes frequent WriteConflicts.
      for (const date of dates) {
        try {
          await HotelAvailability.updateOne(
            { hotelId, roomId, date },
            { 
              $setOnInsert: {
                totalRooms: room.totalRooms,
                bookedRooms: 0,
                heldRooms: 0,
                basePrice: room.price,
                finalPrice: room.price,
                isBlocked: false
              }
            },
            { upsert: true } // No session!
          );
        } catch (e) {
          // Ignore duplicate key errors if two users try to hold the same room at the exact same ms
          if (e.code !== 11000) throw e;
        }
      }

      let totalBasePrice = 0;

      for (const date of dates) {
        // Now inside the transaction, the document is guaranteed to exist.
        const availability = await HotelAvailability.findOne({ hotelId, roomId, date }).session(session);

        if (!availability) throw new Error('Failed to retrieve availability.');
        if (availability.isBlocked) throw new Error(`Room blocked for ${date.toLocaleDateString()}`);

        const availableCount = availability.totalRooms - availability.bookedRooms - availability.heldRooms;
        if (availableCount < needed) {
          throw new Error('Sorry, this room is no longer available for the selected dates. Please choose another room.');
        }

        const updateResult = await HotelAvailability.updateOne(
          { 
             _id: availability._id, 
             $expr: { $gte: [{ $subtract: ["$totalRooms", { $add: ["$bookedRooms", "$heldRooms"] }] }, needed] } 
          },
          { $inc: { heldRooms: needed } },
          { session }
        );

        if (updateResult.modifiedCount === 0) {
          throw new Error('Sorry, this room is no longer available for the selected dates due to high demand.');
        }

        totalBasePrice += availability.finalPrice * needed;
      }

      const holdCode = uuidv4();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);

      const taxAmount = Math.round(totalBasePrice * (room.taxPercent || 18) / 100);
      const discountAmount = Math.round(totalBasePrice * (room.discountPercent || 0) / 100);

      const newHold = await BookingHold.create([{
        holdCode,
        userId: req.user.id,
        hotelId,
        roomId,
        checkInDate,
        checkOutDate,
        dates,
        roomsCount: needed,
        guests: guests || { adults: 1, children: 0 },
        priceSnapshot: {
          basePrice: totalBasePrice,
          taxAmount,
          discountAmount,
          totalPrice: totalBasePrice + taxAmount - discountAmount
        },
        expiresAt
      }], { session });

      await session.commitTransaction();
      session.endSession();

      // Fetch hotel & room info for the response
      const hotel = await Hotel.findById(hotelId);

      return res.status(200).json({
        success: true,
        message: 'Room held successfully',
        hold: {
          ...newHold[0].toObject(),
          hotelName: hotel?.profile?.hotelName || 'Hotel',
          hotelAddress: hotel?.partnerDetails?.address || '',
          hotelCity: hotel?.partnerDetails?.city || '',
          roomType: room.roomType,
          roomAmenities: room.amenities,
          checkInTime: hotel?.profile?.checkInTime || '14:00',
          checkOutTime: hotel?.profile?.checkOutTime || '11:00',
          cancellationPolicy: hotel?.policies?.cancellation || 'Standard cancellation policy',
        }
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();

      if (
        (error.hasErrorLabel && error.hasErrorLabel('TransientTransactionError')) || 
        (error.message && error.message.toLowerCase().includes('write conflict')) ||
        (error.message && error.message.toLowerCase().includes('writeconflict'))
      ) {
        if (attempt === maxRetries) {
          return res.status(500).json({ success: false, message: 'Server is currently busy. Please try again.' });
        }
        attempt++;
        await new Promise(resolve => setTimeout(resolve, 300 * attempt));
        continue;
      }

      return res.status(400).json({ success: false, message: error.message });
    }
  }
};

// @desc    Confirm booking from hold
// @route   POST /api/hotels/confirm
exports.confirmBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { holdId, guestDetails, paymentMode, needPickupCab, couponCode } = req.body;

    const hold = await BookingHold.findById(holdId).session(session);
    if (!hold) throw new Error('Hold record not found');
    if (hold.status !== 'active') throw new Error('This hold is no longer active.');
    if (new Date() > hold.expiresAt) throw new Error('Your room hold has expired. Please select the room again.');

    // Determine payment status based on mode
    let paymentStatus = 'pending';
    let hotelStatus = 'payment_pending';

    if (paymentMode === 'online') {
      // Mock payment simulation - always succeeds
      paymentStatus = 'paid';
      hotelStatus = 'pending_approval';
    } else if (paymentMode === 'pay_at_hotel') {
      paymentStatus = 'pending';
      hotelStatus = 'pending_approval';
    }

    const bookingId = `HTL-${uuidv4().substring(0, 8).toUpperCase()}`;
    // Generate 6-digit OTP for check-in
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const checkoutOtp = Math.floor(100000 + Math.random() * 900000).toString();

    const booking = await Booking.create([{
      bookingId,
      userId: hold.userId,
      bookingType: 'HOTEL',
      hotelBooking: {
        hotelId: hold.hotelId,
        roomId: hold.roomId,
        holdId: hold._id,
        checkInDate: hold.checkInDate,
        checkOutDate: hold.checkOutDate,
        dates: hold.dates,
        roomsCount: hold.roomsCount,
        guests: hold.guests,
        guestDetails: guestDetails || {},
        needPickupCab: needPickupCab || 'no',
        status: hotelStatus,
        otp,
        checkoutOtp,
      },
      paymentMode: paymentMode || 'online',
      paymentStatus,
      totalAmount: hold.priceSnapshot.totalPrice,
      taxAmount: hold.priceSnapshot.taxAmount,
      discountAmount: hold.priceSnapshot.discountAmount,
      couponCode: couponCode || null,
      couponDiscount: 0,
      platformCommission: Math.round(hold.priceSnapshot.totalPrice * 0.1),
      partnerEarning: Math.round(hold.priceSnapshot.totalPrice * 0.9),
    }], { session });

    // Update availability: deduct from heldRooms, add to bookedRooms
    for (const date of hold.dates) {
      await HotelAvailability.updateOne(
        { hotelId: hold.hotelId, roomId: hold.roomId, date },
        { $inc: { heldRooms: -hold.roomsCount, bookedRooms: hold.roomsCount } },
        { session }
      );
    }

    // Mark hold as converted
    hold.status = 'converted';
    await hold.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Fetch enriched data for response
    const hotel = await Hotel.findById(hold.hotelId);
    const room = await Room.findById(hold.roomId);

    res.status(200).json({
      success: true,
      message: 'Booking confirmed successfully!',
      booking: {
        ...booking[0].toObject(),
        hotelName: hotel?.profile?.hotelName || '',
        hotelAddress: hotel?.partnerDetails?.address || '',
        hotelCity: hotel?.partnerDetails?.city || '',
        hotelPhone: hotel?.partnerDetails?.mobile || '',
        roomType: room?.roomType || '',
        checkInTime: hotel?.profile?.checkInTime || '14:00',
        checkOutTime: hotel?.profile?.checkOutTime || '11:00',
        cancellationPolicy: hotel?.policies?.cancellation || 'Standard cancellation policy',
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ success: false, message: error.message });
  }
};
