import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { MapPin, Calendar, Star, ChevronRight, Hotel, Car, Clock, X, Download } from 'lucide-react';

const CustomerDashboard = () => {
  const [activeTab, setActiveTab] = useState('hotel');
  const [hotelBookings, setHotelBookings] = useState([]);
  const [cabBookings, setCabBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const [hotelRes, allRes] = await Promise.all([
          api.get('/hotel-bookings/my'),
          api.get('/bookings/my'),
        ]);
        setHotelBookings(hotelRes.data.data || []);
        setCabBookings((allRes.data.data || []).filter(b => b.bookingType === 'CAB'));
      } catch (err) {
        toast.error('Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const getStatusColor = (status) => {
    const colors = {
      confirmed: 'bg-green-100 text-green-700',
      completed: 'bg-blue-100 text-blue-700',
      cancelled: 'bg-red-100 text-red-700',
      expired: 'bg-gray-100 text-gray-600',
      failed: 'bg-red-100 text-red-600',
      hold_created: 'bg-yellow-100 text-yellow-700',
      payment_pending: 'bg-orange-100 text-orange-700',
      checked_in: 'bg-purple-100 text-purple-700',
      cancellation_requested: 'bg-orange-100 text-orange-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  };

  const formatStatus = (s) => s?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';

  const upcoming = hotelBookings.filter(b => ['confirmed', 'payment_pending', 'hold_created', 'checked_in'].includes(b.hotelBooking?.status));
  const completed = hotelBookings.filter(b => b.hotelBooking?.status === 'completed');
  const cancelled = hotelBookings.filter(b => ['cancelled', 'expired', 'failed', 'cancellation_requested'].includes(b.hotelBooking?.status));

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-heading font-bold text-gray-900 mb-8">My Trips & Bookings</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-8 max-w-md">
          <button onClick={() => setActiveTab('hotel')} className={`flex-1 py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition ${activeTab === 'hotel' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <Hotel size={16} /> Hotel ({hotelBookings.length})
          </button>
          <button onClick={() => setActiveTab('cab')} className={`flex-1 py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition ${activeTab === 'cab' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <Car size={16} /> Cab ({cabBookings.length})
          </button>
        </div>

        {activeTab === 'hotel' ? (
          <div className="space-y-10">
            {/* Upcoming */}
            {upcoming.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Calendar size={18} className="text-primary" /> Upcoming ({upcoming.length})</h2>
                <div className="space-y-4">
                  {upcoming.map((b) => (
                    <BookingCard key={b._id} booking={b} getStatusColor={getStatusColor} formatStatus={formatStatus} showActions />
                  ))}
                </div>
              </div>
            )}

            {/* Completed */}
            {completed.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Star size={18} className="text-blue-500" /> Completed ({completed.length})</h2>
                <div className="space-y-4">
                  {completed.map((b) => (
                    <BookingCard key={b._id} booking={b} getStatusColor={getStatusColor} formatStatus={formatStatus} showReview />
                  ))}
                </div>
              </div>
            )}

            {/* Cancelled */}
            {cancelled.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><X size={18} className="text-red-400" /> Cancelled / Expired ({cancelled.length})</h2>
                <div className="space-y-4">
                  {cancelled.map((b) => (
                    <BookingCard key={b._id} booking={b} getStatusColor={getStatusColor} formatStatus={formatStatus} />
                  ))}
                </div>
              </div>
            )}

            {hotelBookings.length === 0 && (
              <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-gray-100">
                <Hotel size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 mb-4">No hotel bookings yet.</p>
                <Link to="/" className="text-primary font-semibold hover:underline">Book Your First Stay →</Link>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {cabBookings.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-gray-100">
                <Car size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 mb-4">No cab bookings yet.</p>
                <Link to="/cab-booking" className="text-primary font-semibold hover:underline">Book a Ride →</Link>
              </div>
            ) : (
              cabBookings.map((b) => (
                <div key={b._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">CAB</span>
                      <span className="text-sm text-gray-500">{new Date(b.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="font-bold text-gray-900">{b.bookingId}</p>
                    {b.cabBooking && (
                      <div className="text-sm text-gray-600 mt-1">
                        <p>Pickup: {b.cabBooking.pickupLocation?.address || 'N/A'}</p>
                        <p>Drop: {b.cabBooking.dropLocation?.address || 'N/A'}</p>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">₹{b.totalAmount}</p>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${b.cabBooking?.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {b.cabBooking?.status?.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    {!['completed', 'cancelled', 'rejected'].includes(b.cabBooking?.status) && (
                      <div className="mt-4">
                        <Link to={`/cab-tracking/${b._id}`} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition">
                          Track Ride
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const BookingCard = ({ booking, getStatusColor, formatStatus, showActions, showReview }) => {
  const hb = booking.hotelBooking;
  const nights = hb?.dates?.length || 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
        <div className="flex flex-col md:flex-row">
          {/* Image */}
          <div className="md:w-48 h-36 md:h-auto flex-shrink-0">
            <img src={booking.hotelPhotos?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&q=80'} alt={booking.hotelName} className="w-full h-full object-cover" />
          </div>

          {/* Details */}
          <div className="flex-1 p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-xs text-gray-400 font-mono">{booking.bookingId}</p>
                <h3 className="text-lg font-bold text-gray-900">{booking.hotelName}</h3>
                <p className="text-sm text-gray-500 flex items-center gap-1"><MapPin size={12} /> {booking.hotelCity}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(hb?.status)}`}>
                {formatStatus(hb?.status)}
              </span>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-3">
              <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(hb?.checkInDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} → {new Date(hb?.checkOutDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
              <span>{nights} night{nights > 1 ? 's' : ''}</span>
              <span>{booking.roomType}</span>
              <span>{hb?.roomsCount} room{hb?.roomsCount > 1 ? 's' : ''}</span>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-gray-900">₹{booking.totalAmount?.toLocaleString()}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${booking.paymentStatus === 'paid' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                  {booking.paymentStatus === 'paid' ? 'Paid' : booking.paymentMode === 'pay_at_hotel' ? 'Pay at Hotel' : 'Pending'}
                </span>
              </div>

              <div className="flex gap-2">
                {showActions && hb?.status === 'confirmed' && (
                  <Link to={`/hotel-booking/${booking._id}`} className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-semibold hover:bg-primary/20 transition">
                    Manage
                  </Link>
                )}
                {showReview && (
                  <Link to={`/hotel-booking/${booking._id}`} className="px-4 py-2 bg-accent/10 text-accent rounded-lg text-sm font-semibold hover:bg-accent/20 transition">
                    Review
                  </Link>
                )}
                <Link to={`/hotel-booking/${booking._id}`} className="px-4 py-2 text-gray-600 hover:text-primary text-sm font-semibold flex items-center gap-1 transition">
                  Details <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CustomerDashboard;
