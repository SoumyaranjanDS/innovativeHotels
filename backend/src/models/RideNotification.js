const mongoose = require('mongoose');

const rideNotificationSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['sent', 'seen', 'accepted', 'rejected', 'expired'], default: 'sent' },
  sentAt: { type: Date, default: Date.now },
  seenAt: Date,
  respondedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('RideNotification', rideNotificationSchema);
