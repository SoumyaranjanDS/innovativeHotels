import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { MapPin, Calendar, Star, ChevronRight, Hotel, Car, X, AlertCircle, LogOut, User as UserIcon, Users, BedDouble } from 'lucide-react';
import { useLoadScript, GoogleMap, DirectionsRenderer, Marker, Autocomplete } from '@react-google-maps/api';
import { io } from 'socket.io-client';
import ReviewForm from '../components/booking/ReviewForm';
import { useAuth } from '../context/AuthContext';
import CabBooking from './CabBooking';

const libraries = ['places'];

const CustomerDashboard = () => {
  const [hotelBookings, setHotelBookings] = useState([]);
  const [cabBookings, setCabBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [driverLocations, setDriverLocations] = useState({});
  const [reviewModalData, setReviewModalData] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardSubTab, setDashboardSubTab] = useState('hotel');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [hotelSearch, setHotelSearch] = useState({ destination: '', checkIn: '', checkOut: '', guests: 1, rooms: 1 });
  const autocompleteRef = React.useRef(null);

  const { isLoaded } = useLoadScript({ googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY, libraries });

  const fetchBookings = async () => {
    try {
      const [hotelRes, allRes] = await Promise.all([api.get('/hotel-bookings/my'), api.get('/bookings/my')]);
      setHotelBookings(hotelRes.data.data || []);
      setCabBookings((allRes.data.data || []).filter(b => b.bookingType === 'CAB'));
    } catch {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(); // eslint-disable-line react-hooks/set-state-in-effect
    const newSocket = io(import.meta.env.PROD ? import.meta.env.VITE_API_URL : 'http://localhost:5000');
    const userId = JSON.parse(localStorage.getItem('user'))?.id;
    if (userId) newSocket.emit('join_room', { role: 'user', id: userId });
    newSocket.on('location_update', (data) => setDriverLocations(prev => ({ ...prev, [data.bookingId]: { lat: data.lat, lng: data.lng } })));
    newSocket.on('hotel_status_changed', (data) => {
      if (data.status === 'completed') setReviewModalData(data.bookingId);
      fetchBookings();
    });
    return () => newSocket.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place && place.formatted_address) setHotelSearch(s => ({ ...s, destination: place.name || place.formatted_address }));
    }
  };

  const handleHotelSearch = () => {
    if (!hotelSearch.destination.trim()) return toast.error('Please enter a destination');
    if (!hotelSearch.checkIn) return toast.error('Please select a check-in date');
    if (!hotelSearch.checkOut) return toast.error('Please select a check-out date');
    if (new Date(hotelSearch.checkOut) <= new Date(hotelSearch.checkIn)) return toast.error('Check-out must be after check-in');
    navigate(`/hotels?${new URLSearchParams({ city: hotelSearch.destination, checkIn: hotelSearch.checkIn, checkOut: hotelSearch.checkOut, guests: hotelSearch.guests, rooms: hotelSearch.rooms }).toString()}`);
  };

  const handleCancelCabRide = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this cab ride?')) return;
    try {
      await api.post(`/cabs/${bookingId}/cancel`);
      toast.success('Cab ride cancelled successfully');
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel ride');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      confirmed: 'bg-green-100 text-green-700',
      completed: 'bg-blue-100 text-blue-700',
      cancelled: 'bg-red-100 text-red-700',
      expired: 'bg-gray-100 text-gray-600',
      failed: 'bg-red-100 text-red-600',
      hold_created: 'bg-yellow-100 text-yellow-700',
      payment_pending: 'bg-orange-100 text-orange-700',
      pending_approval: 'bg-amber-100 text-amber-700',
      checked_in: 'bg-purple-100 text-purple-700',
      cancellation_requested: 'bg-orange-100 text-orange-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  };

  const formatStatus = (s) => s?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';

  const upcoming = hotelBookings.filter(b => ['confirmed', 'payment_pending', 'hold_created', 'pending_approval', 'checked_in'].includes(b.hotelBooking?.status));
  const completed = hotelBookings.filter(b => b.hotelBooking?.status === 'completed');
  const cancelled = hotelBookings.filter(b => ['cancelled', 'expired', 'failed', 'cancellation_requested'].includes(b.hotelBooking?.status));

  const navItems = [
    { id: 'hotel', tab: 'dashboard', label: 'Hotel Bookings', icon: <Hotel size={17} />, sub: true },
    { id: 'cab', tab: 'dashboard', label: 'Cab Rides', icon: <Car size={17} />, sub: true },
    { id: 'book_hotel', tab: 'book_hotel', label: 'Book Hotel', icon: <Hotel size={17} />, sub: false },
    { id: 'book_cab', tab: 'book_cab', label: 'Book Cab', icon: <Car size={17} />, sub: false },
    { id: 'profile', tab: 'profile', label: 'Profile', icon: <UserIcon size={17} />, sub: false },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-[1440px] mx-auto flex flex-col xl:flex-row min-h-[calc(100vh-5rem)]">

        {/* ── Sidebar ── */}
        <aside className="w-full xl:w-64 shrink-0 bg-white border-b xl:border-b-0 xl:border-r border-gray-200">
          <div className="xl:sticky xl:top-20 xl:h-[calc(100vh-5rem)] flex flex-row xl:flex-col overflow-x-auto xl:overflow-y-auto p-3 xl:p-4 gap-1 xl:gap-0.5 hide-scrollbar">

            {/* User badge — desktop only */}
            <div className="hidden xl:flex items-center gap-3 p-3 mb-4 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>

            {/* Section label desktop */}
            <p className="hidden xl:block text-[10px] font-bold uppercase tracking-widest text-gray-400 px-3 mb-1 mt-1">My Bookings</p>

            {navItems.slice(0, 2).map(item => {
              const isActive = item.sub ? (activeTab === 'dashboard' && dashboardSubTab === item.id) : activeTab === item.tab;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab('dashboard'); setDashboardSubTab(item.id); }}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap xl:w-full ${isActive ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                >
                  {item.icon} {item.label}
                </button>
              );
            })}

            <div className="hidden xl:block my-3 border-t border-gray-100"></div>
            <p className="hidden xl:block text-[10px] font-bold uppercase tracking-widest text-gray-400 px-3 mb-1">Actions</p>

            {navItems.slice(2).map(item => {
              const isActive = activeTab === item.tab;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.tab)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap xl:w-full ${isActive ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                >
                  {item.icon} {item.label}
                </button>
              );
            })}

            <div className="hidden xl:block mt-auto border-t border-gray-100 pt-3">
              <button onClick={logout} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all w-full">
                <LogOut size={17} /> Logout
              </button>
            </div>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 p-4 sm:p-6 xl:p-8 overflow-hidden">

          {/* Hotel & Cab Bookings Tab */}
          {activeTab === 'dashboard' && (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                  {dashboardSubTab === 'hotel' ? 'Hotel Bookings' : 'Cab Rides'}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {dashboardSubTab === 'hotel'
                    ? `${hotelBookings.length} total booking${hotelBookings.length !== 1 ? 's' : ''}`
                    : `${cabBookings.filter(b => !b.cabBooking?.hotelBookingId).length} standalone ride${cabBookings.length !== 1 ? 's' : ''}`}
                </p>
              </div>

              {/* Hotel Bookings */}
              {dashboardSubTab === 'hotel' && (
                <div className="space-y-8">
                  {upcoming.length > 0 && (
                    <section>
                      <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Calendar size={14} className="text-primary" /> Upcoming &amp; Active
                        <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">{upcoming.length}</span>
                      </h2>
                      <div className="space-y-2">
                        {upcoming.map(b => (
                          <BookingRow key={b._id} booking={b} getStatusColor={getStatusColor} formatStatus={formatStatus} showActions associatedCabs={cabBookings.filter(cab => cab.cabBooking?.hotelBookingId === b._id)} isLoaded={isLoaded} driverLocations={driverLocations} />
                        ))}
                      </div>
                    </section>
                  )}

                  {completed.length > 0 && (
                    <section>
                      <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Star size={14} className="text-blue-500" /> Completed
                        <span className="bg-blue-50 text-blue-600 text-[10px] px-2 py-0.5 rounded-full font-bold">{completed.length}</span>
                      </h2>
                      <div className="space-y-2">
                        {completed.map(b => (
                          <BookingRow key={b._id} booking={b} getStatusColor={getStatusColor} formatStatus={formatStatus} showReview onReviewClick={() => setReviewModalData(b._id)} associatedCabs={cabBookings.filter(cab => cab.cabBooking?.hotelBookingId === b._id)} isLoaded={isLoaded} driverLocations={driverLocations} />
                        ))}
                      </div>
                    </section>
                  )}

                  {cancelled.length > 0 && (
                    <section>
                      <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <X size={14} className="text-red-400" /> Cancelled
                        <span className="bg-red-50 text-red-500 text-[10px] px-2 py-0.5 rounded-full font-bold">{cancelled.length}</span>
                      </h2>
                      <div className="space-y-2">
                        {cancelled.map(b => (
                          <BookingRow key={b._id} booking={b} getStatusColor={getStatusColor} formatStatus={formatStatus} associatedCabs={cabBookings.filter(cab => cab.cabBooking?.hotelBookingId === b._id)} isLoaded={isLoaded} driverLocations={driverLocations} />
                        ))}
                      </div>
                    </section>
                  )}

                  {hotelBookings.length === 0 && (
                    <EmptyState icon={<Hotel size={40} />} title="No hotel bookings yet" action={<button onClick={() => setActiveTab('book_hotel')} className="mt-4 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-light transition">Search Hotels</button>} />
                  )}
                </div>
              )}

              {/* Cab Rides */}
              {dashboardSubTab === 'cab' && (
                <div>
                  {cabBookings.filter(b => !b.cabBooking?.hotelBookingId).length > 0 ? (
                    <div className="space-y-2">
                      {cabBookings.filter(b => !b.cabBooking?.hotelBookingId).map(b => (
                        <CabRow key={b._id} booking={b} formatStatus={formatStatus} isLoaded={isLoaded} driverLocations={driverLocations} onCancel={handleCancelCabRide} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState icon={<Car size={40} />} title="No standalone cab rides" action={<button onClick={() => setActiveTab('book_cab')} className="mt-4 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-light transition">Book a Cab</button>} />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Book Hotel */}
          {activeTab === 'book_hotel' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Hotel className="text-primary" size={22} /> Search Hotels</h2>
                <button onClick={() => setActiveTab('dashboard')} className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm font-semibold hover:bg-gray-200 transition flex items-center gap-1"><ChevronRight className="rotate-180" size={15} /> Back</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                <div className="sm:col-span-2 xl:col-span-2 relative">
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Where to?</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    {isLoaded ? (
                      <Autocomplete onLoad={ref => { autocompleteRef.current = ref; }} onPlaceChanged={handlePlaceChanged}>
                        <input type="text" placeholder="City or Hotel Name" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm" onChange={e => setHotelSearch(s => ({ ...s, destination: e.target.value }))} />
                      </Autocomplete>
                    ) : (
                      <input type="text" placeholder="Loading..." disabled className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Check-in</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input type="date" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm" min={new Date().toISOString().split('T')[0]} value={hotelSearch.checkIn} onChange={e => setHotelSearch(s => ({ ...s, checkIn: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Check-out</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input type="date" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm" min={hotelSearch.checkIn || new Date().toISOString().split('T')[0]} value={hotelSearch.checkOut} onChange={e => setHotelSearch(s => ({ ...s, checkOut: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Guests</label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input type="number" min="1" className="w-full pl-10 pr-2 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm" value={hotelSearch.guests} onChange={e => setHotelSearch(s => ({ ...s, guests: parseInt(e.target.value) || 1 }))} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Rooms</label>
                    <div className="relative">
                      <BedDouble className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input type="number" min="1" className="w-full pl-10 pr-2 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm" value={hotelSearch.rooms} onChange={e => setHotelSearch(s => ({ ...s, rooms: parseInt(e.target.value) || 1 }))} />
                    </div>
                  </div>
                </div>
              </div>
              <button onClick={handleHotelSearch} className="mt-6 w-full py-3.5 bg-primary text-white rounded-xl font-bold text-base hover:bg-primary-light transition shadow-md shadow-primary/20">
                Search Hotels
              </button>
            </div>
          )}

          {/* Book Cab */}
          {activeTab === 'book_cab' && (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden relative min-h-[80vh]">
              <button onClick={() => setActiveTab('dashboard')} className="absolute top-5 left-5 z-50 bg-white/90 backdrop-blur px-3 py-2 rounded-lg shadow border border-gray-200 font-bold text-gray-700 hover:text-primary transition flex items-center gap-1.5 text-sm">
                <ChevronRight className="rotate-180" size={15} /> Back
              </button>
              <div className="-mt-12 pointer-events-auto">
                <CabBooking isEmbedded={true} />
              </div>
            </div>
          )}

          {/* Profile */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><UserIcon className="text-primary" size={22} /> Update Profile</h2>
                <button onClick={() => setActiveTab('dashboard')} className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm font-semibold hover:bg-gray-200 transition">Back</button>
              </div>
              <div className="max-w-md space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input type="text" defaultValue={user?.name} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" defaultValue={user?.email} disabled className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input type="tel" defaultValue={user?.mobile} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm" />
                </div>
                <button className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-light transition" onClick={() => toast.success('Profile updated successfully')}>
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {reviewModalData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden relative">
              <button onClick={() => setReviewModalData(null)} className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition z-10">
                <X size={20} className="text-gray-600" />
              </button>
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">How was your stay?</h2>
                <p className="text-sm text-gray-500 mb-6">Your checkout is complete. We&apos;d love to hear your feedback!</p>
                <ReviewForm bookingId={reviewModalData} onSuccess={() => { setReviewModalData(null); fetchBookings(); }} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Empty State ─── */
const EmptyState = ({ icon, title, action }) => (
  <div className="text-center py-20 text-gray-400">
    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-2xl mb-4 text-gray-300">{icon}</div>
    <p className="text-gray-500 font-medium">{title}</p>
    {action}
  </div>
);

/* ─── Hotel Booking Row ─── */
const BookingRow = ({ booking, getStatusColor, formatStatus, showActions, showReview, onReviewClick, associatedCabs = [], isLoaded, driverLocations }) => {
  const [expanded, setExpanded] = useState(false);
  const hb = booking.hotelBooking;
  const nights = hb?.dates?.length || 0;

  const getTimelineMessage = () => {
    if (hb?.status === 'pending_approval') return '⏳ Waiting for hotel approval';
    if (hb?.status === 'completed') return `Completed on ${new Date(hb?.checkOutDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    if (['cancelled', 'failed', 'expired', 'cancellation_requested'].includes(hb?.status)) return 'Booking cancelled / failed';
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const checkIn = new Date(hb?.checkInDate); checkIn.setHours(0, 0, 0, 0);
    const checkOut = new Date(hb?.checkOutDate); checkOut.setHours(0, 0, 0, 0);
    const diffDays = Math.round((checkIn - today) / 86400000);
    if (diffDays === 0) return '📍 Check-in is Today!';
    if (diffDays === 1) return '⏳ Check-in is Tomorrow';
    if (diffDays > 1) return `🗓️ Check-in in ${diffDays} days`;
    if (diffDays < 0 && today <= checkOut) return '🏨 Currently Staying';
    return 'Past check-in date';
  };

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <div className={`bg-white border rounded-xl transition-all ${expanded ? 'border-primary/30 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>

        {/* Main Row */}
        <div
          className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 cursor-pointer"
          onClick={() => setExpanded(e => !e)}
        >
          {/* Left info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${getStatusColor(hb?.status)}`}>
                {formatStatus(hb?.status)}
              </span>
              <span className="text-xs text-gray-400 font-mono hidden sm:inline">{booking.bookingId}</span>
            </div>
            <p className="font-bold text-gray-900 text-base truncate">{booking.hotelName}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500 mt-1">
              <span className="flex items-center gap-1"><MapPin size={11} />{booking.hotelCity}</span>
              <span className="flex items-center gap-1">
                <Calendar size={11} />
                {new Date(hb?.checkInDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} → {new Date(hb?.checkOutDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
              <span>{nights} night{nights > 1 ? 's' : ''} · {hb?.roomsCount} room{hb?.roomsCount > 1 ? 's' : ''}</span>
            </div>
            <p className="text-xs font-medium text-blue-600 mt-1 sm:hidden">{getTimelineMessage()}</p>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <p className="text-xs font-medium text-blue-600 hidden sm:block">{getTimelineMessage()}</p>
            <div className="text-right ml-auto sm:ml-0">
              <p className="text-lg font-bold text-gray-900">₹{booking.totalAmount?.toLocaleString()}</p>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded inline-block ${booking.paymentStatus === 'paid' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                {booking.paymentStatus === 'paid' ? 'PAID' : booking.paymentMode === 'pay_at_hotel' ? 'PAY AT HOTEL' : 'PENDING'}
              </span>
            </div>
            <ChevronRight size={18} className={`text-gray-400 transition-transform shrink-0 ${expanded ? 'rotate-90' : ''}`} />
          </div>
        </div>

        {/* Expanded Details */}
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
              <div className="border-t border-gray-100 px-4 sm:px-5 py-4 space-y-4">

                {/* Status message */}
                {hb?.status === 'pending_approval' && (
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg p-3">
                    <AlertCircle size={15} className="text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-800 font-medium">Hotel approval pending. Cab booking and modifications are locked until confirmed.</p>
                  </div>
                )}

                {/* OTPs */}
                {(hb?.otp || hb?.checkoutOtp) && hb?.status !== 'pending_approval' && (
                  <div className="flex gap-6 bg-gray-50 rounded-lg px-4 py-3">
                    {hb?.otp && (
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Check-in OTP</p>
                        <p className="font-mono font-bold text-gray-900 tracking-widest text-sm">{hb.otp}</p>
                      </div>
                    )}
                    {hb?.checkoutOtp && (
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Check-out OTP</p>
                        <p className="font-mono font-bold text-gray-900 tracking-widest text-sm">{hb.checkoutOtp}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {showActions && hb?.status === 'confirmed' && (
                    <Link to={`/hotel-booking/${booking._id}`} className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-bold hover:bg-primary/20 transition">Manage</Link>
                  )}
                  {showReview && (
                    <button onClick={() => onReviewClick && onReviewClick()} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-100 transition">Write Review</button>
                  )}
                  {hb?.status !== 'pending_approval' && (
                    <Link to={`/hotel-booking/${booking._id}`} className="px-4 py-2 text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg text-sm font-bold flex items-center gap-1 transition border border-gray-200">
                      View Details <ChevronRight size={14} />
                    </Link>
                  )}
                </div>

                {/* Linked Cabs */}
                {associatedCabs.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Linked Cab Bookings</p>
                    <div className="space-y-2">
                      {associatedCabs.map(cab => (
                        <div key={cab._id} className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-full"><Car size={13} /></div>
                              <div>
                                <p className="font-semibold text-xs text-gray-900">{cab.bookingId}</p>
                                <p className="text-[11px] text-gray-500 mt-0.5">{cab.cabBooking?.pickupLocation?.address?.substring(0, 30)}... → Hotel</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {cab.cabBooking?.otp && hb?.status !== 'pending_approval' && (
                                <div className="text-right">
                                  <p className="text-[10px] uppercase font-bold text-gray-400">Cab OTP</p>
                                  <p className="text-xs font-mono font-bold text-indigo-600">{cab.cabBooking.otp}</p>
                                </div>
                              )}
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cab.cabBooking?.status === 'completed' ? 'bg-green-100 text-green-700' : ['cancelled', 'rejected'].includes(cab.cabBooking?.status) ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {formatStatus(cab.cabBooking?.status)}
                              </span>
                            </div>
                          </div>
                          <CabRideStepper status={cab.cabBooking?.status} />
                          {['accepted', 'assigned', 'on_the_way', 'arrived_at_pickup', 'trip_started'].includes(cab.cabBooking?.status) && (
                            <div className="mt-3">
                              <MiniTrackingMap cab={cab} isLoaded={isLoaded} driverLocations={driverLocations} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

/* ─── Cab Row ─── */
const CabRow = ({ booking: b, isLoaded, driverLocations, onCancel }) => {
  const [expanded, setExpanded] = useState(false);
  const status = b.cabBooking?.status;
  const isActive = ['accepted', 'assigned', 'on_the_way', 'arrived_at_pickup', 'trip_started'].includes(status);
  const isDone = ['completed', 'cancelled', 'rejected'].includes(status);

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <div className={`bg-white border rounded-xl transition-all ${expanded ? 'border-indigo-300 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 cursor-pointer" onClick={() => setExpanded(e => !e)}>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">CAB</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status === 'completed' ? 'bg-green-100 text-green-700' : ['cancelled', 'rejected'].includes(status) ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {status?.replace(/_/g, ' ').toUpperCase()}
              </span>
              <span className="text-xs text-gray-400 font-mono hidden sm:inline">{b.bookingId}</span>
            </div>
            <p className="font-bold text-gray-900 text-sm truncate">{b.cabBooking?.vehicleType} · {b.cabBooking?.passengers} pax</p>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500 mt-1">
              <span>From: {b.cabBooking?.pickupLocation?.address?.substring(0, 30) || 'N/A'}</span>
              <span>To: {b.cabBooking?.dropLocation?.address?.substring(0, 30) || 'N/A'}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="text-right ml-auto sm:ml-0">
              <p className="text-lg font-bold text-gray-900">₹{b.totalAmount}</p>
              <p className="text-[10px] text-gray-400">{new Date(b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
            </div>
            {b.cabBooking?.otp && (
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-gray-400">OTP</p>
                <p className="text-sm font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{b.cabBooking.otp}</p>
              </div>
            )}
            <ChevronRight size={18} className={`text-gray-400 transition-transform shrink-0 ${expanded ? 'rotate-90' : ''}`} />
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
              <div className="border-t border-gray-100 px-4 sm:px-5 py-4 space-y-4">
                <CabRideStepper status={status} />

                {isActive && (
                  <div>
                    <MiniTrackingMap cab={b} isLoaded={isLoaded} driverLocations={driverLocations} />
                  </div>
                )}

                {!isDone && (
                  <div className="flex flex-wrap gap-2">
                    <Link to={`/cab-tracking/${b._id}`} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition">Track Ride</Link>
                    {!['trip_started'].includes(status) && (
                      <button onClick={() => onCancel(b._id)} className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-bold hover:bg-red-50 transition">Cancel</button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

/* ─── Mini Tracking Map ─── */
const MiniTrackingMap = ({ cab, isLoaded, driverLocations }) => {
  const [directions, setDirections] = useState(null);
  const driverLoc = driverLocations[cab._id];

  useEffect(() => {
    if (!window.google || !cab.cabBooking?.pickupLocation || !cab.cabBooking?.dropLocation) return;
    const svc = new window.google.maps.DirectionsService();
    const status = cab.cabBooking.status;
    let origin, destination;
    if (['assigned', 'on_the_way', 'arrived_at_pickup'].includes(status)) {
      origin = driverLoc || { lat: cab.cabBooking.pickupLocation.lat - 0.01, lng: cab.cabBooking.pickupLocation.lng - 0.01 };
      destination = cab.cabBooking.pickupLocation;
    } else if (['trip_started', 'completed'].includes(status)) {
      origin = cab.cabBooking.pickupLocation;
      destination = cab.cabBooking.dropLocation;
    } else {
      setTimeout(() => setDirections(null), 0);
      return;
    }
    svc.route({ origin, destination, travelMode: window.google.maps.TravelMode.DRIVING }, (result, reqStatus) => {
      if (reqStatus === window.google.maps.DirectionsStatus.OK) setDirections(result);
    });
  }, [cab.cabBooking, driverLoc]);

  const mapCenter = driverLoc || cab.cabBooking?.pickupLocation || { lat: 20.5937, lng: 78.9629 };
  if (!isLoaded) return <div className="h-40 bg-gray-100 rounded-xl flex items-center justify-center text-xs text-gray-400">Loading Map...</div>;

  return (
    <div className="h-44 w-full bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
      <GoogleMap mapContainerStyle={{ width: '100%', height: '100%' }} zoom={13} center={mapCenter} options={{ disableDefaultUI: true, gestureHandling: 'greedy' }}>
        {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: true, polylineOptions: { strokeColor: '#4f46e5', strokeWeight: 4 } }} />}
        {cab.cabBooking?.pickupLocation && <Marker position={cab.cabBooking.pickupLocation} icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png' }} />}
        {cab.cabBooking?.dropLocation && <Marker position={cab.cabBooking.dropLocation} icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' }} />}
        {driverLoc && <Marker position={driverLoc} icon={{ path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 5, fillColor: '#4f46e5', fillOpacity: 1, strokeWeight: 2, strokeColor: '#ffffff', rotation: 0 }} />}
      </GoogleMap>
    </div>
  );
};

/* ─── Ride Progress Stepper ─── */
const CabRideStepper = ({ status }) => {
  const steps = [
    { id: 'requested', label: 'Requested', match: ['requested', 'notified_drivers', 'external_cabs_notified', 'hotel_cabs_notified', 'accepted', 'assigned', 'on_the_way', 'arrived_at_pickup', 'trip_started', 'completed'] },
    { id: 'assigned', label: 'Assigned', match: ['accepted', 'assigned', 'on_the_way', 'arrived_at_pickup', 'trip_started', 'completed'] },
    { id: 'arrived', label: 'Reached', match: ['arrived_at_pickup', 'trip_started', 'completed'] },
    { id: 'started', label: 'Picked Up', match: ['trip_started', 'completed'] },
    { id: 'completed', label: 'Done', match: ['completed'] },
  ];

  if (['cancelled', 'rejected'].includes(status)) {
    return (
      <div className="w-full bg-red-50 text-red-600 p-2.5 rounded-lg text-xs text-center font-bold">
        Ride {status.charAt(0).toUpperCase() + status.slice(1)}
      </div>
    );
  }

  const currentIndex = [...steps].reverse().findIndex(s => s.match.includes(status));
  const activeIndex = currentIndex === -1 ? 0 : steps.length - 1 - currentIndex;
  const progress = (activeIndex / (steps.length - 1)) * 100;

  return (
    <div className="w-full py-3">
      <div className="flex items-center justify-between relative px-2 sm:px-3">
        <div className="absolute left-2 sm:left-3 right-2 sm:right-3 top-3.5 h-1 bg-gray-200 rounded-full"></div>
        <div className="absolute left-2 sm:left-3 top-3.5 h-1 bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `calc(${progress}% - 24px)` }}></div>
        {steps.map((step, index) => {
          const isCompleted = step.match.includes(status);
          const isCurrent = index === activeIndex;
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors ${isCompleted ? 'bg-indigo-600 border-indigo-300 text-white' : 'bg-white border-gray-200'}`}>
                {isCompleted ? <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> : <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>}
              </div>
              <span className={`text-[9px] sm:text-[10px] font-bold absolute top-9 whitespace-nowrap ${isCurrent ? 'text-indigo-600' : isCompleted ? 'text-gray-700' : 'text-gray-400'}`}>{step.label}</span>
            </div>
          );
        })}
      </div>
      <div className="h-5"></div>
    </div>
  );
};

export default CustomerDashboard;
