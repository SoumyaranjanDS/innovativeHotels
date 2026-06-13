const mongoose = require('mongoose');

const hotelAvailabilitySchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  date: { type: Date, required: true },
  totalRooms: { type: Number, required: true },
  bookedRooms: { type: Number, default: 0 },
  heldRooms: { type: Number, default: 0 },
  basePrice: { type: Number, required: true },
  finalPrice: { type: Number, required: true },
  taxPercent: { type: Number, default: 0 },
  discountPercent: { type: Number, default: 0 },
  isBlocked: { type: Boolean, default: false }
}, { timestamps: true });

hotelAvailabilitySchema.index({ hotelId: 1, roomId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('HotelAvailability', hotelAvailabilitySchema);
