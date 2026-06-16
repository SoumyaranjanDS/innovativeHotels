const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const HotelAvailability = require('../models/HotelAvailability');
const Review = require('../models/Review');
const SupportTicket = require('../models/SupportTicket');

// @desc    Get customer's hotel bookings
// @route   GET /api/hotel-bookings/my
exports.getMyHotelBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id, bookingType: 'HOTEL' })
      .sort({ createdAt: -1 });

    // Enrich with hotel/room info
    const enriched = await Promise.all(bookings.map(async (b) => {
      const hotel = await Hotel.findById(b.hotelBooking?.hotelId);
      const room = await Room.findById(b.hotelBooking?.roomId);
      return {
        ...b.toObject(),
        hotelName: hotel?.profile?.hotelName || 'Unknown',
        hotelCity: hotel?.partnerDetails?.city || '',
        hotelAddress: hotel?.partnerDetails?.address || '',
        hotelPhone: hotel?.partnerDetails?.mobile || '',
        hotelPhotos: hotel?.documents?.propertyPhotos || [],
        roomType: room?.roomType || '',
        roomPhoto: room?.roomPhotos?.[0] || '',
        checkInTime: hotel?.profile?.checkInTime || '14:00',
        checkOutTime: hotel?.profile?.checkOutTime || '11:00',
        cancellationPolicy: hotel?.policies?.cancellation || 'Standard policy',
      };
    }));

    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single hotel booking detail
// @route   GET /api/hotel-bookings/:id
exports.getHotelBookingDetail = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id, userId: req.user.id, bookingType: 'HOTEL'
    });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const hotel = await Hotel.findById(booking.hotelBooking?.hotelId);
    const room = await Room.findById(booking.hotelBooking?.roomId);
    const reviews = await Review.find({ bookingId: booking._id, userId: req.user.id });

    res.json({
      success: true,
      data: {
        ...booking.toObject(),
        hotelName: hotel?.profile?.hotelName || '',
        hotelCity: hotel?.partnerDetails?.city || '',
        hotelAddress: hotel?.partnerDetails?.address || '',
        hotelPhone: hotel?.partnerDetails?.mobile || '',
        hotelPhotos: hotel?.documents?.propertyPhotos || [],
        roomType: room?.roomType || '',
        roomPhoto: room?.roomPhotos?.[0] || '',
        roomAmenities: room?.amenities || [],
        checkInTime: hotel?.profile?.checkInTime || '14:00',
        checkOutTime: hotel?.profile?.checkOutTime || '11:00',
        policies: hotel?.policies || {},
        hasReview: reviews.length > 0,
        review: reviews[0] || null,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel booking request
// @route   PATCH /api/hotel-bookings/:id/cancel
exports.cancelBookingRequest = async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findOne({
      _id: req.params.id, userId: req.user.id, bookingType: 'HOTEL'
    });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const allowedStatuses = ['confirmed', 'payment_pending', 'hold_created'];
    if (!allowedStatuses.includes(booking.hotelBooking.status)) {
      return res.status(400).json({ success: false, message: 'This booking cannot be cancelled.' });
    }

    // For confirmed bookings: release inventory
    if (booking.hotelBooking.status === 'confirmed') {
      for (const date of booking.hotelBooking.dates) {
        await HotelAvailability.updateOne(
          { hotelId: booking.hotelBooking.hotelId, roomId: booking.hotelBooking.roomId, date },
          { $inc: { bookedRooms: -booking.hotelBooking.roomsCount } }
        );
      }
    }

    booking.hotelBooking.status = 'cancelled';
    booking.hotelBooking.cancellationReason = reason || 'Cancelled by customer';

    // Handle refund status
    if (booking.paymentStatus === 'paid') {
      booking.paymentStatus = 'refund_initiated';
    }

    await booking.save();

    res.json({ success: true, message: 'Booking cancelled successfully', data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Modification request
// @route   PATCH /api/hotel-bookings/:id/modify
exports.modifyBookingRequest = async (req, res) => {
  try {
    const { newCheckInDate, newCheckOutDate, newGuestCount, newRoomsCount, specialRequest } = req.body;
    const booking = await Booking.findOne({
      _id: req.params.id, userId: req.user.id, bookingType: 'HOTEL'
    });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (booking.hotelBooking.status !== 'confirmed') {
      return res.status(400).json({ success: false, message: 'Only confirmed bookings can be modified.' });
    }

    booking.hotelBooking.modificationRequest = {
      requestedAt: new Date(),
      newCheckInDate: newCheckInDate || booking.hotelBooking.checkInDate,
      newCheckOutDate: newCheckOutDate || booking.hotelBooking.checkOutDate,
      newGuestCount: newGuestCount || booking.hotelBooking.guests?.adults,
      newRoomsCount: newRoomsCount || booking.hotelBooking.roomsCount,
      specialRequest: specialRequest || '',
      status: 'pending',
    };

    await booking.save();
    res.json({ success: true, message: 'Modification request submitted for review.', data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add review
// @route   POST /api/hotel-bookings/:id/review
exports.addReview = async (req, res) => {
  try {
    const { rating, comment, images } = req.body;
    const booking = await Booking.findOne({
      _id: req.params.id, userId: req.user.id, bookingType: 'HOTEL'
    });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (booking.hotelBooking.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Reviews are only allowed for completed bookings.' });
    }

    const existing = await Review.findOne({ bookingId: booking._id, userId: req.user.id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this booking.' });
    }

    const review = await Review.create({
      bookingId: booking._id,
      userId: req.user.id,
      hotelId: booking.hotelBooking.hotelId,
      rating,
      comment: comment || '',
      images: images || [],
    });

    res.status(201).json({ success: true, message: 'Review submitted!', data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create support ticket
// @route   POST /api/hotel-bookings/:id/support
exports.createSupportTicket = async (req, res) => {
  try {
    const { category, subject, message } = req.body;
    const booking = await Booking.findOne({
      _id: req.params.id, userId: req.user.id
    });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const ticket = await SupportTicket.create({
      bookingId: booking._id,
      userId: req.user.id,
      category,
      subject,
      message,
      messages: [{
        sender: req.user.id,
        senderModel: 'User',
        message: message,
        timestamp: new Date()
      }]
    });

    const io = req.app.get('io');
    if (io) {
      io.to('admin').emit('new_support_ticket', ticket);
    }

    res.status(201).json({ success: true, message: 'Support ticket created!', data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
