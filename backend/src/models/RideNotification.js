const mongoose = require('mongoose');

const rideNotificationSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  cabProviderId: { type: mongoose.Schema.Types.ObjectId, ref: 'CabVendor' },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' },
  status: { type: String, enum: ['sent', 'seen', 'accepted', 'rejected', 'expired'], default: 'sent' },
  sentAt: { type: Date, default: Date.now },
  seenAt: Date,
  respondedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('RideNotification', rideNotificationSchema);
