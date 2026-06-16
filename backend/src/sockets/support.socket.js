const SupportTicket = require('../models/SupportTicket');

module.exports = (io) => {
  io.on('connection', (socket) => {
    
    // Join a specific ticket room
    socket.on('join_ticket', ({ ticketId }) => {
      socket.join(`ticket_${ticketId}`);
      console.log(`Socket ${socket.id} joined ticket room ${ticketId}`);
    });

    // Send a message in a ticket
    socket.on('send_ticket_message', async (data) => {
      try {
        const { ticketId, sender, senderModel, message } = data;
        
        const ticket = await SupportTicket.findById(ticketId);
        if (!ticket) return;

        const newMessage = {
          sender,
          senderModel,
          message,
          timestamp: new Date()
        };

        ticket.messages.push(newMessage);
        await ticket.save();

        // Broadcast the updated ticket to everyone in the room
        io.to(`ticket_${ticketId}`).emit('new_ticket_message', ticket);
        
        // Also notify admin dashboard if someone is there
        if (senderModel === 'User') {
           io.to('admin').emit('support_ticket_updated', ticket);
        }

      } catch (err) {
        console.error('Socket Ticket Message Error:', err);
      }
    });
    
    // Admin changes status
    socket.on('update_ticket_status', async (data) => {
       try {
           const { ticketId, status } = data;
           const ticket = await SupportTicket.findById(ticketId);
           if (!ticket) return;
           
           ticket.status = status;
           await ticket.save();
           
           io.to(`ticket_${ticketId}`).emit('new_ticket_message', ticket);
           io.to('admin').emit('support_ticket_updated', ticket);
       } catch (err) {
           console.error('Socket Ticket Status Update Error:', err);
       }
    });

  });
};
