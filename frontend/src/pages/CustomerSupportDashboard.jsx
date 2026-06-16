import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { Headphones, X, Send, Plus, Ticket } from 'lucide-react';
import { io } from 'socket.io-client';

const CustomerSupportDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);

    const fetchTickets = async () => {
      try {
        const res = await api.get('/support');
        setTickets(res.data.tickets);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();

    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
    setSocket(newSocket);
    
    if (userData?.id) {
        newSocket.emit('join_room', { role: 'user', id: userData.id });
    }

    newSocket.on('new_ticket_message', (updatedTicket) => {
      setTickets(prev => prev.map(t => t._id === updatedTicket._id ? updatedTicket : t));
      setSelectedTicket(prev => prev?._id === updatedTicket._id ? updatedTicket : prev);
    });

    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
    if (selectedTicket && socket) {
      socket.emit('join_ticket', { ticketId: selectedTicket._id });
    }
  }, [selectedTicket, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedTicket?.messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || !selectedTicket) return;

    socket.emit('send_ticket_message', {
      ticketId: selectedTicket._id,
      sender: user.id,
      senderModel: 'User',
      message: chatMessage
    });
    setChatMessage('');
  };

  const openTicket = (ticket) => {
    setSelectedTicket(ticket);
  };

  if (loading) return <div className="p-8 text-center max-w-5xl mx-auto mt-10">Loading your support tickets...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col h-[calc(100vh-160px)]">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-heading">Support Center</h1>
            <p className="text-gray-500">Need help? Chat with our support team about your bookings.</p>
          </div>
        </div>

        {tickets.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col items-center justify-center">
            <Headphones size={64} className="text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Support Tickets</h2>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              You haven't opened any support tickets yet. If you need help with a booking, you can create a ticket from the booking details page.
            </p>
          </div>
        ) : (
          <div className="flex flex-1 gap-6 overflow-hidden">
            {/* Tickets List */}
            <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden ${selectedTicket ? 'hidden md:flex md:w-1/3' : 'w-full'}`}>
              <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 flex items-center gap-2"><Ticket size={18} className="text-primary"/> Your Tickets</h3>
              </div>
              <div className="overflow-y-auto flex-1 p-3 space-y-3">
                {tickets.map(ticket => (
                  <div 
                    key={ticket._id} 
                    onClick={() => openTicket(ticket)}
                    className={`p-4 rounded-xl cursor-pointer transition border ${selectedTicket?._id === ticket._id ? 'bg-primary/5 border-primary/20 shadow-sm' : 'border-gray-100 hover:bg-gray-50'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{ticket.category.replace('_', ' ')}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${ticket.status === 'open' ? 'bg-yellow-100 text-yellow-700' : ticket.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {ticket.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-900 truncate">{ticket.subject}</h4>
                    <p className="text-sm text-gray-500 truncate mt-1">{ticket.message}</p>
                    <div className="mt-3 text-xs text-gray-400 font-medium">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Window */}
            {selectedTicket ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col h-full overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-gray-900 text-lg">{selectedTicket.subject}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${selectedTicket.status === 'open' ? 'bg-yellow-100 text-yellow-700' : selectedTicket.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {selectedTicket.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 font-medium">Booking Reference: {selectedTicket.bookingId?.bookingId || 'N/A'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setSelectedTicket(null)} className="p-2 bg-white shadow-sm border border-gray-200 hover:bg-gray-50 rounded-full md:hidden">
                      <X size={20} className="text-gray-600"/>
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-gray-50/50 to-white">
                  {/* Initial message */}
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-gray-400 mr-2 mb-1 font-medium">You - {new Date(selectedTicket.createdAt).toLocaleTimeString()}</span>
                    <div className="bg-primary text-white px-5 py-3.5 rounded-2xl rounded-tr-sm max-w-[80%] shadow-sm">
                      {selectedTicket.message}
                    </div>
                  </div>

                  {/* Chat messages */}
                  {selectedTicket.messages?.filter(m => m.message !== selectedTicket.message).map((msg, idx) => {
                    const isMe = msg.sender === user.id;
                    return (
                      <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <span className={`text-xs text-gray-400 mb-1 font-medium ${isMe ? 'mr-2' : 'ml-2'}`}>
                          {isMe ? 'You' : 'Support Team'} - {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                        <div className={`px-5 py-3.5 rounded-2xl max-w-[80%] shadow-sm ${
                          isMe 
                            ? 'bg-primary text-white rounded-tr-sm' 
                            : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
                        }`}>
                          {msg.message}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input area */}
                <div className="p-5 border-t border-gray-100 bg-white">
                  {selectedTicket.status === 'resolved' ? (
                    <div className="text-center text-sm font-medium text-gray-500 py-3 bg-gray-50 rounded-xl border border-gray-100">
                      This ticket has been marked as resolved by our team.
                    </div>
                  ) : (
                    <form onSubmit={handleSendMessage} className="flex gap-3">
                      <input
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        placeholder="Type your message here..."
                        className="flex-1 px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                      />
                      <button 
                        type="submit" 
                        disabled={!chatMessage.trim()}
                        className="bg-primary text-white px-6 rounded-xl hover:bg-primary-dark transition disabled:opacity-50 flex items-center justify-center font-bold"
                      >
                        <Send size={18} className="mr-2" />
                        <span className="hidden md:inline">Send Message</span>
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ) : (
              <div className="hidden md:flex flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 items-center justify-center p-8 text-center flex-col">
                 <Headphones size={64} className="text-primary/20 mb-6" />
                 <h3 className="text-2xl font-bold text-gray-800 mb-2 font-heading">Select a Conversation</h3>
                 <p className="text-gray-500 max-w-sm">Choose a support ticket from the list to view the conversation history and reply to our support team.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerSupportDashboard;
