import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { Headphones, Send, Plus } from 'lucide-react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const ProviderSupport = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  
  // New Ticket State
  const [isCreating, setIsCreating] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', category: 'other', message: '' });

  useEffect(() => {
    fetchTickets();

    const newSocket = io(import.meta.env.PROD ? import.meta.env.VITE_API_URL : 'http://localhost:5000');
    setSocket(newSocket);
    newSocket.emit('join_room', { role: 'user', id: user.id });

    newSocket.on('new_ticket_message', (updatedTicket) => {
      setTickets(prev => prev.map(t => t._id === updatedTicket._id ? updatedTicket : t));
      setSelectedTicket(prev => prev?._id === updatedTicket._id ? updatedTicket : prev);
    });

    return () => newSocket.disconnect();
  }, [user.id]);

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

  useEffect(() => {
    if (selectedTicket && socket) {
      // Join immediately if connected
      if (socket.connected) {
        socket.emit('join_ticket', { ticketId: selectedTicket._id });
      }

      // Handle reconnects
      const onConnect = () => {
        socket.emit('join_room', { role: 'user', id: user.id });
        socket.emit('join_ticket', { ticketId: selectedTicket._id });
      };

      socket.on('connect', onConnect);

      return () => {
        socket.off('connect', onConnect);
      };
    }
  }, [selectedTicket, socket, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedTicket?.messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || !selectedTicket) return;

    socket.emit('send_ticket_message', {
      ticketId: selectedTicket._id,
      sender: user.id,
      senderModel: 'User', // Provider uses User model
      message: chatMessage
    });
    setChatMessage('');
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/support', newTicket);
      if (res.data.success) {
        toast.success('Support ticket created');
        setTickets([res.data.ticket, ...tickets]);
        setIsCreating(false);
        setNewTicket({ subject: '', category: 'other', message: '' });
        setSelectedTicket(res.data.ticket);
      }
    } catch (err) {
      toast.error('Failed to create ticket');
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-100px)] max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 font-heading">Support Chat</h2>
          <p className="text-gray-500">Contact our admin team for any issues or queries</p>
        </div>
        <button 
          onClick={() => { setIsCreating(true); setSelectedTicket(null); }}
          className="bg-primary text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-primary-light transition shadow-sm"
        >
          <Plus size={18} />
          New Ticket
        </button>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Tickets List */}
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden ${selectedTicket || isCreating ? 'hidden md:flex md:w-1/3' : 'w-full'}`}>
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-bold text-gray-800">Your Tickets</h3>
          </div>
          <div className="overflow-y-auto flex-1 p-3 space-y-2">
            {tickets.map(ticket => (
              <div 
                key={ticket._id} 
                onClick={() => { setSelectedTicket(ticket); setIsCreating(false); }}
                className={`p-4 rounded-xl cursor-pointer transition border ${selectedTicket?._id === ticket._id ? 'bg-primary/5 border-primary/20 shadow-sm' : 'border-gray-100 hover:bg-gray-50'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{ticket.category.replace('_', ' ')}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${ticket.status === 'open' ? 'bg-yellow-100 text-yellow-700' : ticket.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {ticket.status}
                  </span>
                </div>
                <h4 className="font-bold text-gray-900 truncate text-sm">{ticket.subject}</h4>
                <div className="mt-2 text-xs text-gray-400">
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
            {tickets.length === 0 && (
              <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                <Headphones size={32} className="text-gray-300 mb-2"/>
                <p>No support tickets yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Create Ticket View */}
        {isCreating && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 p-6 flex flex-col overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Create New Support Ticket</h3>
            <form onSubmit={handleCreateTicket} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Subject</label>
                <input type="text" required value={newTicket.subject} onChange={e => setNewTicket({...newTicket, subject: e.target.value})} className="w-full border border-gray-200 rounded-lg p-3" placeholder="Brief description of the issue" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                <select value={newTicket.category} onChange={e => setNewTicket({...newTicket, category: e.target.value})} className="w-full border border-gray-200 rounded-lg p-3">
                  <option value="other">General / Payment</option>
                  <option value="hotel_issue">Hotel Operations</option>
                  <option value="refund_issue">Refund / Settlement</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Initial Message</label>
                <textarea required value={newTicket.message} onChange={e => setNewTicket({...newTicket, message: e.target.value})} className="w-full border border-gray-200 rounded-lg p-3 h-32 resize-none" placeholder="Explain your issue in detail..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold">Submit Ticket</button>
                <button type="button" onClick={() => setIsCreating(false)} className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-xl font-bold hover:bg-gray-200">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Chat Window */}
        {selectedTicket && !isCreating && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-900 text-lg">{selectedTicket.subject}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${selectedTicket.status === 'open' ? 'bg-yellow-100 text-yellow-700' : selectedTicket.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {selectedTicket.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500">Ticket ID: {selectedTicket._id.slice(-6)}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-gray-50/30">
              {/* Initial message */}
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-semibold text-gray-400 mr-2 mb-1 uppercase tracking-wider">You - {new Date(selectedTicket.createdAt).toLocaleTimeString()}</span>
                <div className="bg-primary text-white px-5 py-3 rounded-2xl rounded-tr-sm max-w-[85%] shadow-sm text-sm">
                  {selectedTicket.message}
                </div>
              </div>

              {/* Chat messages */}
              {selectedTicket.messages?.map((msg, idx) => {
                const isMe = msg.senderModel === 'User';
                return (
                  <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className={`text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wider ${isMe ? 'mr-2' : 'ml-2'}`}>
                      {isMe ? 'You' : 'Admin Support'} - {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                    <div className={`px-5 py-3 rounded-2xl max-w-[85%] shadow-sm text-sm ${
                      isMe 
                        ? 'bg-primary text-white rounded-tr-sm' 
                        : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
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
              {selectedTicket.status === 'resolved' || selectedTicket.status === 'closed' ? (
                <div className="text-center text-sm font-medium text-gray-500 py-3 bg-gray-50 rounded-xl">
                  This ticket has been closed. Please create a new ticket for further assistance.
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  />
                  <button 
                    type="submit" 
                    disabled={!chatMessage.trim()}
                    className="bg-primary text-white p-3 md:px-6 rounded-xl hover:bg-primary-dark transition disabled:opacity-50 flex items-center justify-center"
                  >
                    <Send size={18} className="md:mr-2" />
                    <span className="hidden md:inline font-bold">Send</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
        
        {!selectedTicket && !isCreating && (
          <div className="hidden md:flex flex-1 bg-white rounded-xl shadow-sm border border-gray-100 items-center justify-center p-8 text-center flex-col">
             <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-4">
               <Headphones size={36} className="text-primary" />
             </div>
             <h3 className="text-xl font-bold text-gray-900 mb-2">How can we help you?</h3>
             <p className="text-gray-500 max-w-sm text-sm">Select an existing ticket or create a new one to communicate with our admin support team.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderSupport;
