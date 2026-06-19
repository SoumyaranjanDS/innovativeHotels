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

// @desc    Create a new generic support ticket
// @route   POST /api/support
exports.createSupportTicket = async (req, res) => {
  try {
    const { subject, category, message } = req.body;

    const ticket = await SupportTicket.create({
      userId: req.user.id,
      userModel: 'User', // Support tickets are linked to User model
      subject: subject || 'General Query',
      category: category || 'other',
      message: message, // Missing root message field
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

    res.status(201).json({ success: true, ticket });
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
