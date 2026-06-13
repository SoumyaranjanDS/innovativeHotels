const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookingType: { type: String, enum: ['HOTEL', 'CAB'], required: true },
  
  // Hotel Specific
  hotelBooking: {
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
    checkInDate: Date,
    checkOutDate: Date,
    roomsCount: Number,
    guests: { adults: Number, children: Number },
    status: { type: String, enum: ['pending', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show', 'expired', 'failed'] }
  },

  // Cab Specific
  cabBooking: {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'CabVendor' },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
    pickupLocation: {
      address: String,
      placeId: String,
      lat: Number,
      lng: Number
    },
    dropLocation: {
      address: String,
      placeId: String,
      lat: Number,
      lng: Number
    },
    pickupDateTime: Date,
    tripType: String,
    passengers: Number,
    luggageCount: Number,
    vehicleType: String,
    distanceKm: Number,
    durationMinutes: Number,
    fareSnapshot: {
      baseFare: Number,
      distanceFare: Number,
      timeFare: Number,
      taxAmount: Number,
      minimumFareApplied: Boolean
    },
    acceptedAt: Date,
    startedAt: Date,
    completedAt: Date,
    cancelledAt: Date,
    statusLogs: [{
      status: String,
      timestamp: Date,
      location: { lat: Number, lng: Number }
    }],
    status: { 
      type: String, 
      enum: ['requested', 'notified_drivers', 'accepted', 'assigned', 'on_the_way', 'arrived_at_pickup', 'trip_started', 'completed', 'cancelled', 'rejected', 'no_driver_found', 'no_show'],
      default: 'requested'
    }
  },

  // Payment Details
  paymentMode: { type: String, enum: ['online', 'cod'], default: 'online' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'partially_paid', 'failed', 'refund_initiated', 'refunded', 'partially_refunded', 'cod_pending', 'cod_collected'], default: 'pending' },
  codCollectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'CabVendor' },
  codCollectedAt: Date,
  totalAmount: { type: Number, required: true },
  taxAmount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  platformCommission: { type: Number, default: 0 },
  partnerEarning: { type: Number, default: 0 }

}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
