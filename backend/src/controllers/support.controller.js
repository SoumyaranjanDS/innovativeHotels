const SupportTicket = require('../models/SupportTicket');

// @desc    Get all support tickets for logged-in user
// @route   GET /api/support
exports.getMySupportTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ userId: req.user.id })
      .populate('bookingId', 'bookingId')
      .sort({ createdAt: -1 });
    res.json({ success: true, tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reply to a support ticket
// @route   PATCH /api/support/:id/reply
exports.replyToSupportTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    const ticket = await SupportTicket.findOne({ _id: id, userId: req.user.id });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    if (message) {
      ticket.messages.push({
        sender: req.user.id,
        senderModel: 'User',
        message: message,
        timestamp: new Date()
      });
    }

    await ticket.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`ticket_${ticket._id}`).emit('new_ticket_message', ticket);
    }

    res.json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
