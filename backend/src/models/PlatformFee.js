const mongoose = require('mongoose');

const platformFeeSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cabProviderId: { type: mongoose.Schema.Types.ObjectId, ref: 'CabVendor' },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' },
  grossFare: { type: Number, required: true },
  platformFee: { type: Number, required: true },
  driverEarning: { type: Number, required: true },
  feeStatus: { type: String, enum: ['pending', 'payable', 'paid', 'waived', 'overdue'], default: 'pending' },
  dueDate: Date,
  paidAt: Date,
  paymentReference: String
}, { timestamps: true });

module.exports = mongoose.model('PlatformFee', platformFeeSchema);
