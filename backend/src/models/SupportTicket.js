const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: {
    type: String,
    enum: ['booking_issue', 'payment_issue', 'refund_issue', 'hotel_issue', 'cab_pickup_issue', 'cancellation_issue', 'other'],
    required: true
  },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
  messages: [{
    sender: { type: mongoose.Schema.Types.ObjectId, refPath: 'messages.senderModel' },
    senderModel: { type: String, enum: ['User', 'Admin'], required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
