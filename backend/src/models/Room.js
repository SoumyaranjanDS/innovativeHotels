const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
  roomType: { type: String, required: true },
  occupancy: { type: Number, required: true },
  bedType: String,
  roomPhotos: [String],
  amenities: [String],
  price: { type: Number, required: true },
  extraGuestCharge: { type: Number, default: 0 },
  taxPercent: { type: Number, default: 0 },
  discountPercent: { type: Number, default: 0 },
  totalRooms: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
