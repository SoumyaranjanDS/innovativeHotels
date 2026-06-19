import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { Headphones, X, Send, CheckCircle } from 'lucide-react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const AdminSupport = () => {
  const { user: adminUser } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  useEffect(() => {

    const fetchTickets = async () => {
      try {
        const res = await api.get('/admin/support');
        setTickets(res.data.tickets);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();

    const newSocket = io(import.meta.env.PROD ? import.meta.env.VITE_API_URL : 'http://localhost:5000');
    setSocket(newSocket);
    newSocket.emit('join_room', { role: 'admin', id: 'admin' });
    newSocket.emit('join_support_admin');

    newSocket.on('new_support_ticket', (ticket) => {
      setTickets(prev => [ticket, ...prev]);
    });

    newSocket.on('support_ticket_updated', (updatedTicket) => {
      setTickets(prev => prev.map(t => t._id === updatedTicket._id ? updatedTicket : t));
      setSelectedTicket(prev => prev?._id === updatedTicket._id ? updatedTicket : prev);
    });

    newSocket.on('new_ticket_message', (updatedTicket) => {
      setTickets(prev => prev.map(t => t._id === updatedTicket._id ? updatedTicket : t));
      setSelectedTicket(prev => prev?._id === updatedTicket._id ? updatedTicket : prev);
    });

    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
    if (selectedTicket && socket) {
      // Join immediately if connected
      if (socket.connected) {
        socket.emit('join_ticket', { ticketId: selectedTicket._id });
      }
      
      // Handle reconnects
      const onConnect = () => {
        socket.emit('join_room', { role: 'admin', id: 'admin' });
        socket.emit('join_support_admin');
        socket.emit('join_ticket', { ticketId: selectedTicket._id });
      };
      
      socket.on('connect', onConnect);
      
      return () => {
        socket.off('connect', onConnect);
      };
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
      sender: adminUser?.id,
      senderModel: 'Admin',
      message: chatMessage
    });
    setChatMessage('');
  };

  const handleStatusChange = (status) => {
    if (!selectedTicket) return;
    socket.emit('update_ticket_status', {
      ticketId: selectedTicket._id,
      status
    });
  };

  const openTicket = (ticket) => {
    setSelectedTicket(ticket);
  };

  if (loading) return <div className="p-8">Loading support tickets...</div>;

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-100px)]">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Support Tickets</h2>
          <p className="text-gray-500">Manage user inquiries and platform support requests</p>
        </div>
        <div className="bg-primary/10 text-primary px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
          <Headphones size={18} />
          {tickets.filter(t => t.status === 'open').length} Open
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Tickets List */}
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden ${selectedTicket ? 'hidden md:flex md:w-1/3' : 'w-full'}`}>
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800">All Tickets</h3>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {tickets.map(ticket => (
              <div 
                key={ticket._id} 
                onClick={() => openTicket(ticket)}
                className={`p-4 rounded-xl cursor-pointer transition border ${selectedTicket?._id === ticket._id ? 'bg-primary/5 border-primary/20' : 'border-gray-100 hover:bg-gray-50'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{ticket.category.replace('_', ' ')}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${ticket.status === 'open' ? 'bg-yellow-100 text-yellow-700' : ticket.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {ticket.status}
                  </span>
                </div>
                <h4 className="font-bold text-gray-900 truncate">{ticket.subject}</h4>
                <p className="text-sm text-gray-500 truncate">{ticket.message}</p>
                <div className="mt-2 text-xs text-gray-400">
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
            {tickets.length === 0 && (
              <div className="p-8 text-center text-gray-500">No support tickets found.</div>
            )}
          </div>
        </div>

        {/* Chat Window */}
        {selectedTicket && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-900 text-lg">{selectedTicket.subject}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${selectedTicket.status === 'open' ? 'bg-yellow-100 text-yellow-700' : selectedTicket.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {selectedTicket.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500">From: {selectedTicket.userId?.name || 'User'} | Booking ID: {selectedTicket.bookingId?.bookingId || 'N/A'}</p>
              </div>
              <div className="flex items-center gap-2">
                {selectedTicket.status !== 'resolved' && (
                  <button onClick={() => handleStatusChange('resolved')} className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg text-sm font-semibold transition">
                    <CheckCircle size={16} /> Mark Resolved
                  </button>
                )}
                <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-gray-200 rounded-full md:hidden">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
              {/* Initial message */}
              <div className="flex flex-col items-start">
                <span className="text-xs text-gray-400 ml-2 mb-1">Customer - {new Date(selectedTicket.createdAt).toLocaleTimeString()}</span>
                <div className="bg-gray-100 text-gray-800 px-4 py-3 rounded-2xl rounded-tl-sm max-w-[80%] border border-gray-200 shadow-sm">
                  {selectedTicket.message}
                </div>
              </div>

              {/* Chat messages */}
              {selectedTicket.messages?.map((msg, idx) => {
                const isAdmin = msg.senderModel === 'Admin';
                return (
                  <div key={idx} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                    <span className={`text-xs text-gray-400 mb-1 ${isAdmin ? 'mr-2' : 'ml-2'}`}>
                      {isAdmin ? 'You (Support)' : 'Customer'} - {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                    <div className={`px-4 py-3 rounded-2xl max-w-[80%] shadow-sm ${
                      isAdmin 
                        ? 'bg-primary text-white rounded-tr-sm' 
                        : 'bg-gray-100 text-gray-800 border border-gray-200 rounded-tl-sm'
                    }`}>
                      {msg.message}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="p-4 border-t border-gray-100 bg-white">
              {selectedTicket.status === 'resolved' ? (
                <div className="text-center text-sm text-gray-500 py-2">
                  This ticket is marked as resolved. <button onClick={() => handleStatusChange('open')} className="text-primary hover:underline font-semibold">Reopen ticket</button>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Type a reply to the customer..."
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <button 
                    type="submit" 
                    disabled={!chatMessage.trim()}
                    className="bg-primary text-white p-2 md:px-6 rounded-xl hover:bg-primary-dark transition disabled:opacity-50 flex items-center justify-center"
                  >
                    <Send size={18} className="md:mr-2" />
                    <span className="hidden md:inline font-semibold">Send</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
        
        {!selectedTicket && (
          <div className="hidden md:flex flex-1 bg-white rounded-xl shadow-sm border border-gray-100 items-center justify-center p-8 text-center flex-col">
             <Headphones size={48} className="text-gray-200 mb-4" />
             <h3 className="text-xl font-bold text-gray-800">Select a Ticket</h3>
             <p className="text-gray-500 max-w-sm">Choose a support ticket from the list to view the conversation and reply to the customer.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSupport;
