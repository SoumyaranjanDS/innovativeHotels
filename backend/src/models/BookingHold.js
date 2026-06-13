const mongoose = require('mongoose');

const bookingHoldSchema = new mongoose.Schema({
  holdCode: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  checkInDate: { type: Date, required: true },
  checkOutDate: { type: Date, required: true },
  dates: [{ type: Date, required: true }],
  roomsCount: { type: Number, required: true },
  guests: {
    adults: { type: Number, required: true },
    children: { type: Number, default: 0 }
  },
  priceSnapshot: {
    basePrice: Number,
    taxAmount: Number,
    discountAmount: Number,
    totalPrice: Number
  },
  status: { type: String, enum: ['active', 'converted', 'expired', 'released'], default: 'active' },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

// TTL index to automatically remove/expire the document, though we will also use a cron job.
bookingHoldSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('BookingHold', bookingHoldSchema);
