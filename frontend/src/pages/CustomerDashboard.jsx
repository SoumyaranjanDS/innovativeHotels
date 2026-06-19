import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { MapPin, Calendar, Star, ChevronRight, Hotel, Car, Clock, X, Download, AlertCircle, LogOut, User as UserIcon, Users, BedDouble } from 'lucide-react';
import { useLoadScript, GoogleMap, DirectionsRenderer, Marker, Autocomplete } from '@react-google-maps/api';
import { io } from 'socket.io-client';
import ReviewForm from '../components/booking/ReviewForm';
import { useAuth } from '../context/AuthContext';
import Home from './Home';
import CabBooking from './CabBooking';

const libraries = ['places'];

const CustomerDashboard = () => {
  const [hotelBookings, setHotelBookings] = useState([]);
  const [cabBookings, setCabBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [driverLocations, setDriverLocations] = useState({});
  const [reviewModalData, setReviewModalData] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardSubTab, setDashboardSubTab] = useState('hotel');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Hotel search state
  const [hotelSearch, setHotelSearch] = useState({
    destination: '',
    checkIn: '',
    checkOut: '',
    guests: 1,
    rooms: 1,
  });
  const autocompleteRef = React.useRef(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries
  });

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

  useEffect(() => {
    fetchBookings();

    const newSocket = io(import.meta.env.PROD ? import.meta.env.VITE_API_URL : 'http://localhost:5000');
    
    const userId = JSON.parse(localStorage.getItem('user'))?.id;
    if (userId) {
      newSocket.emit('join_room', { role: 'user', id: userId });
    }

    newSocket.on('location_update', (data) => {
      setDriverLocations(prev => ({
        ...prev,
        [data.bookingId]: { lat: data.lat, lng: data.lng }
      }));
    });

    newSocket.on('hotel_status_changed', (data) => {
      if (data.status === 'completed') {
        setReviewModalData(data.bookingId);
      }
      fetchBookings(); // refresh UI
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  const handlePlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      if (place && place.formatted_address) {
        let city = place.name || place.formatted_address;
        setHotelSearch({ ...hotelSearch, destination: city });
      }
    }
  };

  const handleHotelSearch = () => {
    if (!hotelSearch.destination.trim()) {
      toast.error('Please enter a destination');
      return;
    }
    if (!hotelSearch.checkIn) {
      toast.error('Please select a check-in date');
      return;
    }
    if (!hotelSearch.checkOut) {
      toast.error('Please select a check-out date');
      return;
    }
    if (new Date(hotelSearch.checkOut) <= new Date(hotelSearch.checkIn)) {
      toast.error('Check-out date must be after check-in date');
      return;
    }

    const params = new URLSearchParams({
      city: hotelSearch.destination,
      checkIn: hotelSearch.checkIn,
      checkOut: hotelSearch.checkOut,
      guests: hotelSearch.guests,
      rooms: hotelSearch.rooms,
    });
    navigate(`/hotels?${params.toString()}`);
  };

  const handleCancelCabRide = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this cab ride?")) return;
    try {
      await api.post(`/cabs/${bookingId}/cancel`);
      toast.success("Cab ride cancelled successfully");
      fetchBookings(); // Refresh the list
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel ride");
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
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 lg:p-6 sticky top-24 z-30 flex flex-row lg:flex-col overflow-x-auto gap-2 lg:gap-4 lg:h-[calc(100vh-8rem)] hide-scrollbar">
            <h2 className="font-bold text-xl mb-4 text-gray-900 hidden lg:block">Customer Panel</h2>
            <nav className="flex flex-row lg:flex-col gap-2 min-w-max lg:min-w-0 flex-1">
              <button 
                onClick={() => { setActiveTab('dashboard'); setDashboardSubTab('hotel'); }}
                className={`text-left px-4 py-3 rounded-xl font-medium flex items-center gap-3 transition whitespace-nowrap ${activeTab === 'dashboard' && dashboardSubTab === 'hotel' ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-50 hover:text-primary'}`}
              >
                <Hotel size={18} /> My Hotel Bookings
              </button>
              <button 
                onClick={() => { setActiveTab('dashboard'); setDashboardSubTab('cab'); }}
                className={`text-left px-4 py-3 rounded-xl font-medium flex items-center gap-3 transition whitespace-nowrap ${activeTab === 'dashboard' && dashboardSubTab === 'cab' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'}`}
              >
                <Car size={18} /> My Cab Rides
              </button>

              <div className="hidden lg:block my-2 border-t border-gray-100"></div>

              <button 
                onClick={() => setActiveTab('book_hotel')}
                className={`text-left px-4 py-3 rounded-xl font-medium flex items-center gap-3 transition whitespace-nowrap ${activeTab === 'book_hotel' ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-50 hover:text-primary'}`}
              >
                <Hotel size={18} /> Book Hotel
              </button>
              <button 
                onClick={() => setActiveTab('book_cab')}
                className={`text-left px-4 py-3 rounded-xl font-medium flex items-center gap-3 transition whitespace-nowrap ${activeTab === 'book_cab' ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-50 hover:text-primary'}`}
              >
                <Car size={18} /> Book Cab
              </button>
              <button 
                onClick={() => setActiveTab('profile')}
                className={`text-left px-4 py-3 rounded-xl font-medium flex items-center gap-3 transition whitespace-nowrap ${activeTab === 'profile' ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-50 hover:text-primary'}`}
              >
                <UserIcon size={18} /> Update Profile
              </button>
            </nav>

            <div className="lg:mt-auto lg:border-t lg:border-gray-100 lg:pt-4 flex items-center">
              <button 
                onClick={logout}
                className="w-full text-left px-4 py-3 rounded-xl font-medium flex items-center gap-3 text-red-600 hover:bg-red-50 transition whitespace-nowrap"
              >
                <LogOut size={18} /> Logout
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 w-full overflow-hidden">
          {activeTab === 'dashboard' && (
            <div>
              <div className="mb-8">
                <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">My Bookings</h1>
                <p className="text-gray-500">Manage your hotel stays and cab rides</p>
              </div>

              <div className="space-y-10">
                {dashboardSubTab === 'hotel' && (
                  <>
            {upcoming.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Calendar size={18} className="text-primary" /> Upcoming ({upcoming.length})</h2>
                <div className="space-y-4">
                  {upcoming.map((b) => (
                    <BookingCard 
                      key={b._id} 
                      booking={b} 
                      getStatusColor={getStatusColor} 
                      formatStatus={formatStatus} 
                      showActions 
                      associatedCabs={cabBookings.filter(cab => cab.cabBooking?.hotelBookingId === b._id)}
                      isLoaded={isLoaded}
                      driverLocations={driverLocations}
                    />
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
                    <BookingCard 
                      key={b._id} 
                      booking={b} 
                      getStatusColor={getStatusColor} 
                      formatStatus={formatStatus} 
                      showReview 
                      onReviewClick={() => setReviewModalData(b._id)}
                      associatedCabs={cabBookings.filter(cab => cab.cabBooking?.hotelBookingId === b._id)}
                      isLoaded={isLoaded}
                      driverLocations={driverLocations}
                    />
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
                    <BookingCard 
                      key={b._id} 
                      booking={b} 
                      getStatusColor={getStatusColor} 
                      formatStatus={formatStatus} 
                      associatedCabs={cabBookings.filter(cab => cab.cabBooking?.hotelBookingId === b._id)}
                      isLoaded={isLoaded}
                      driverLocations={driverLocations}
                    />
                  ))}
                </div>
              </div>
            )}

            {hotelBookings.length === 0 && cabBookings.length === 0 && (
              <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-gray-100">
                <Hotel size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 mb-4">No bookings yet.</p>
                <Link to="/" className="text-primary font-semibold hover:underline">Book Your First Stay →</Link>
              </div>
            )}
            </>
          )}

          {dashboardSubTab === 'cab' && (
            <>

            {/* Standalone Cab Bookings */}
            {cabBookings.filter(b => !b.cabBooking?.hotelBookingId).length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Car size={18} className="text-indigo-500" /> Independent Cab Rides</h2>
                <div className="space-y-4">
                  {cabBookings.filter(b => !b.cabBooking?.hotelBookingId).map((b) => (
                    <div key={b._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
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
                        <div className="text-left md:text-right flex flex-col items-start md:items-end gap-2">
                          <p className="text-xl font-bold text-gray-900">₹{b.totalAmount}</p>
                          <div className="flex gap-4 items-center">
                            {b.cabBooking?.otp && (
                              <div className="text-left md:text-right">
                                <p className="text-[10px] uppercase font-bold text-gray-400">Ride OTP</p>
                                <p className="text-sm font-mono font-bold tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{b.cabBooking.otp}</p>
                              </div>
                            )}
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${b.cabBooking?.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {b.cabBooking?.status?.replace(/_/g, ' ').toUpperCase()}
                            </span>
                          </div>
                          {!['completed', 'cancelled', 'rejected'].includes(b.cabBooking?.status) && (
                            <div className="mt-2 flex gap-2 w-full md:w-auto">
                              <Link to={`/cab-tracking/${b._id}`} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition text-center flex-1 md:flex-none">
                                Track Ride
                              </Link>
                              {!['trip_started'].includes(b.cabBooking?.status) && (
                                <button 
                                  onClick={() => handleCancelCabRide(b._id)}
                                  className="px-4 py-2 border-2 border-red-100 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 transition flex-1 md:flex-none"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Live Tracking Map & Stepper for Active Independent Cab */}
                      {b.cabBooking && (
                        <div className="w-full mt-2 pt-4 border-t border-gray-100">
                          <CabRideStepper status={b.cabBooking.status} />
                          {['accepted', 'assigned', 'on_the_way', 'arrived_at_pickup', 'trip_started'].includes(b.cabBooking.status) && (
                            <div className="mt-4">
                              <MiniTrackingMap cab={b} isLoaded={isLoaded} driverLocations={driverLocations} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            </>
          )}
          </div>
        </div>
      )}

      {activeTab === 'book_hotel' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-[60vh]">
          <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3"><Hotel className="text-primary"/> Search Hotels</h2>
            <button onClick={() => setActiveTab('dashboard')} className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-semibold hover:bg-gray-200 transition flex items-center gap-2"><ChevronRight className="rotate-180" size={16}/> Back</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2 relative">
              <label className="block text-sm font-bold text-gray-700 mb-2">Where to?</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                {isLoaded ? (
                  <Autocomplete onLoad={ref => autocompleteRef.current = ref} onPlaceChanged={handlePlaceChanged}>
                    <input type="text" placeholder="City or Hotel Name" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none" onChange={(e) => setHotelSearch({...hotelSearch, destination: e.target.value})} />
                  </Autocomplete>
                ) : (
                  <input type="text" placeholder="Loading..." disabled className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" />
                )}
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-bold text-gray-700 mb-2">Check-in</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="date" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none" min={new Date().toISOString().split('T')[0]} value={hotelSearch.checkIn} onChange={(e) => setHotelSearch({...hotelSearch, checkIn: e.target.value})} />
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-bold text-gray-700 mb-2">Check-out</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="date" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none" min={hotelSearch.checkIn || new Date().toISOString().split('T')[0]} value={hotelSearch.checkOut} onChange={(e) => setHotelSearch({...hotelSearch, checkOut: e.target.value})} />
              </div>
            </div>

            <div className="relative flex gap-2">
              <div className="flex-1">
                <label className="block text-sm font-bold text-gray-700 mb-2">Guests</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input type="number" min="1" className="w-full pl-10 pr-2 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none" value={hotelSearch.guests} onChange={(e) => setHotelSearch({...hotelSearch, guests: parseInt(e.target.value) || 1})} />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-bold text-gray-700 mb-2">Rooms</label>
                <div className="relative">
                  <BedDouble className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input type="number" min="1" className="w-full pl-10 pr-2 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none" value={hotelSearch.rooms} onChange={(e) => setHotelSearch({...hotelSearch, rooms: parseInt(e.target.value) || 1})} />
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <button onClick={handleHotelSearch} className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg hover:bg-primary-light transition shadow-lg shadow-primary/30 flex justify-center items-center gap-2">
              Search Hotels
            </button>
          </div>
        </div>
      )}

      {activeTab === 'book_cab' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative min-h-[80vh]">
          <button onClick={() => setActiveTab('dashboard')} className="absolute top-6 left-6 z-50 bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow border border-gray-200 font-bold text-gray-700 hover:text-primary transition flex items-center gap-2">
            <ChevronRight className="rotate-180" size={16}/> Back to Dashboard
          </button>
          <div className="-mt-12 pointer-events-auto">
            <CabBooking isEmbedded={true} />
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-[60vh]">
          <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3"><UserIcon className="text-primary"/> Update Profile</h2>
            <button onClick={() => setActiveTab('dashboard')} className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-semibold hover:bg-gray-200 transition">Back</button>
          </div>
          <div className="max-w-md">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" defaultValue={user?.name} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" defaultValue={user?.email} disabled className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input type="tel" defaultValue={user?.mobile} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <button className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-light transition w-full mt-4" onClick={() => toast.success("Profile updated successfully")}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

        </div>
      </div>

      <AnimatePresence>
        {reviewModalData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden relative"
            >
              <button
                onClick={() => setReviewModalData(null)}
                className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition z-10"
              >
                <X size={20} className="text-gray-600" />
              </button>
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">How was your stay?</h2>
                <p className="text-sm text-gray-500 mb-6">Your checkout is complete. We'd love to hear your feedback!</p>
                <ReviewForm 
                  bookingId={reviewModalData} 
                  onSuccess={() => {
                    setReviewModalData(null);
                    fetchBookings();
                  }} 
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MiniTrackingMap = ({ cab, isLoaded, driverLocations }) => {
  const [directions, setDirections] = useState(null);
  const driverLoc = driverLocations[cab._id];

  useEffect(() => {
    if (!window.google || !cab.cabBooking?.pickupLocation || !cab.cabBooking?.dropLocation) return;
    const directionsService = new window.google.maps.DirectionsService();
    const status = cab.cabBooking.status;
    let origin, destination;

    if (['assigned', 'on_the_way', 'arrived_at_pickup'].includes(status)) {
      origin = driverLoc || { 
        lat: cab.cabBooking.pickupLocation.lat - 0.01, 
        lng: cab.cabBooking.pickupLocation.lng - 0.01 
      };
      destination = cab.cabBooking.pickupLocation;
    } else if (['trip_started', 'completed'].includes(status)) {
      origin = cab.cabBooking.pickupLocation;
      destination = cab.cabBooking.dropLocation;
    } else {
      setDirections(null);
      return;
    }

    directionsService.route(
      {
        origin,
        destination,
        travelMode: window.google.maps.TravelMode.DRIVING
      },
      (result, reqStatus) => {
        if (reqStatus === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);
        }
      }
    );
  }, [cab.cabBooking, driverLoc]);

  const mapCenter = driverLoc || cab.cabBooking?.pickupLocation || { lat: 20.5937, lng: 78.9629 };

  if (!isLoaded) return <div className="h-32 bg-gray-100 rounded-xl flex items-center justify-center text-xs text-gray-500">Loading Map...</div>;

  return (
    <div className="h-48 w-full bg-gray-100 rounded-xl overflow-hidden mt-3 relative border border-gray-200">
      <GoogleMap 
        mapContainerStyle={{ width: '100%', height: '100%' }}
        zoom={13}
        center={mapCenter}
        options={{ disableDefaultUI: true, gestureHandling: 'greedy' }}
      >
        {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: true, polylineOptions: { strokeColor: '#4f46e5', strokeWeight: 4 } }} />}
        {cab.cabBooking?.pickupLocation && <Marker position={cab.cabBooking.pickupLocation} icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png' }} />}
        {cab.cabBooking?.dropLocation && <Marker position={cab.cabBooking.dropLocation} icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' }} />}
        {driverLoc && (
          <Marker 
            position={driverLoc} 
            icon={{
              path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 5,
              fillColor: "#4f46e5",
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: "#ffffff",
              rotation: 0
            }} 
          />
        )}
      </GoogleMap>
    </div>
  );
};

const CabRideStepper = ({ status }) => {
  const steps = [
    { id: 'requested', label: 'Requested', match: ['requested', 'notified_drivers', 'external_cabs_notified', 'hotel_cabs_notified', 'accepted', 'assigned', 'on_the_way', 'arrived_at_pickup', 'trip_started', 'completed'] },
    { id: 'assigned', label: 'Assigned', match: ['accepted', 'assigned', 'on_the_way', 'arrived_at_pickup', 'trip_started', 'completed'] },
    { id: 'arrived', label: 'Reached', match: ['arrived_at_pickup', 'trip_started', 'completed'] },
    { id: 'started', label: 'Picked Up', match: ['trip_started', 'completed'] },
    { id: 'completed', label: 'Complete', match: ['completed'] }
  ];

  if (['cancelled', 'rejected'].includes(status)) {
    return (
      <div className="w-full bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-bold mt-2">
        Ride {status.charAt(0).toUpperCase() + status.slice(1)}
      </div>
    );
  }

  // Calculate progress percentage
  const currentIndex = [...steps].reverse().findIndex(s => s.match.includes(status));
  const activeIndex = currentIndex === -1 ? 0 : steps.length - 1 - currentIndex;
  const progress = (activeIndex / (steps.length - 1)) * 100;

  return (
    <div className="w-full py-4 mt-2">
      <div className="flex items-center justify-between relative px-2 sm:px-4">
        <div className="absolute left-2 sm:left-4 right-2 sm:right-4 top-4 h-1 bg-gray-200 rounded-full"></div>
        <div 
          className="absolute left-2 sm:left-4 top-4 h-1 bg-indigo-600 rounded-full transition-all duration-500 ease-in-out"
          style={{ width: `calc(${progress}% - 32px)` }}
        ></div>
        
        {steps.map((step, index) => {
          const isCompleted = step.match.includes(status);
          const isCurrent = index === activeIndex;
          
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 transition-colors duration-300 ${isCompleted ? 'bg-indigo-600 border-indigo-200 text-white' : 'bg-white border-gray-200'}`}>
                {isCompleted ? (
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                   </svg>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                )}
              </div>
              <span className={`text-[10px] sm:text-xs font-bold absolute top-10 whitespace-nowrap ${isCurrent ? 'text-indigo-600' : isCompleted ? 'text-gray-800' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="h-6"></div>
    </div>
  );
};

const BookingCard = ({ booking, getStatusColor, formatStatus, showActions, showReview, onReviewClick, associatedCabs = [], isLoaded, driverLocations }) => {
  const hb = booking.hotelBooking;
  const nights = hb?.dates?.length || 0;

  const getTimelineMessage = () => {
    if (hb?.status === 'pending_approval') return '⏳ Waiting for Hotel Approval';
    if (hb?.status === 'completed') return `Completed on ${new Date(hb?.checkOutDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    if (['cancelled', 'failed', 'expired', 'cancellation_requested'].includes(hb?.status)) return 'Booking Cancelled / Failed';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkIn = new Date(hb?.checkInDate);
    checkIn.setHours(0, 0, 0, 0);
    const checkOut = new Date(hb?.checkOutDate);
    checkOut.setHours(0, 0, 0, 0);

    const diffDays = Math.round((checkIn - today) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '📍 Check-in is Today!';
    if (diffDays === 1) return '⏳ Check-in is Tomorrow';
    if (diffDays > 1) return `🗓️ Check-in in ${diffDays} days`;
    if (diffDays < 0 && today <= checkOut) return '🏨 Currently Staying';
    return 'Past Check-in Date';
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
        <div className="flex flex-col md:flex-row">
          {/* Image */}
          <div className="md:w-48 h-36 md:h-auto shrink-0">
            <img src={booking.hotelPhotos?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&q=80'} alt={booking.hotelName} className="w-full h-full object-cover" />
          </div>

          {/* Details */}
          <div className="flex-1 p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-xs text-gray-400 font-mono mb-1">{booking.bookingId}</p>
                <h3 className="text-lg font-bold text-gray-900">{booking.hotelName}</h3>
                <p className="text-sm text-gray-500 flex items-center gap-1"><MapPin size={12} /> {booking.hotelCity}</p>
              </div>
              <div className="flex items-center gap-3">
                {hb?.status !== 'pending_approval' && (
                  <div className="flex gap-2">
                    {hb?.otp && (
                      <div className="bg-gray-50 border border-gray-200 px-3 py-1 rounded-md text-center">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Check-in OTP</p>
                        <p className="text-sm font-mono font-bold text-gray-900 tracking-widest">{hb.otp}</p>
                      </div>
                    )}
                    {hb?.checkoutOtp && (
                      <div className="bg-gray-50 border border-gray-200 px-3 py-1 rounded-md text-center">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Check-out OTP</p>
                        <p className="text-sm font-mono font-bold text-gray-900 tracking-widest">{hb.checkoutOtp}</p>
                      </div>
                    )}
                  </div>
                )}
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(hb?.status)}`}>
                  {formatStatus(hb?.status)}
                </span>
              </div>
            </div>

            <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-2 mt-2 mb-1">
              <p className="text-xs font-semibold text-blue-800">{getTimelineMessage()}</p>
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
                  <button 
                    onClick={() => onReviewClick && onReviewClick()} 
                    className="px-4 py-2 bg-accent/10 text-accent rounded-lg text-sm font-semibold hover:bg-accent/20 transition"
                  >
                    Review
                  </button>
                )}
                {hb?.status !== 'pending_approval' && (
                  <Link to={`/hotel-booking/${booking._id}`} className="px-4 py-2 text-gray-600 hover:text-primary text-sm font-semibold flex items-center gap-1 transition">
                    Details <ChevronRight size={14} />
                  </Link>
                )}
              </div>
            </div>

            {hb?.status === 'pending_approval' && (
              <div className="bg-yellow-50/80 border border-yellow-200 rounded-lg p-3 mt-4 flex items-start gap-3">
                <AlertCircle className="text-yellow-600 shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-sm font-bold text-yellow-800">Pending Hotel Approval</p>
                  <p className="text-xs text-yellow-700 mt-0.5">No actions (like cab booking or modifications) can be performed until the hotel confirms your stay.</p>
                </div>
              </div>
            )}

            {/* Attached Cabs Section */}
            {associatedCabs.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Linked Cab Bookings</p>
                <div className="space-y-3">
                  {associatedCabs.map(cab => (
                    <div key={cab._id} className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 flex flex-col gap-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-full">
                            <Car size={16} />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-gray-900">{cab.bookingId}</p>
                            <p className="text-xs text-gray-500">{cab.cabBooking?.pickupLocation?.address?.substring(0, 25)}... → Hotel</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-4">
                          {cab.cabBooking?.otp && hb?.status !== 'pending_approval' && (
                            <div className="text-right">
                              <p className="text-[10px] uppercase font-bold text-gray-400">Cab Ride OTP</p>
                              <p className="text-sm font-mono font-bold tracking-widest text-indigo-600">{cab.cabBooking.otp}</p>
                            </div>
                          )}
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${cab.cabBooking?.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {formatStatus(cab.cabBooking?.status)}
                          </span>
                        </div>
                      </div>
                      {/* Live Tracking Map and Stepper for Active Linked Cab */}
                      <div className="w-full mt-2">
                        <CabRideStepper status={cab.cabBooking?.status} />
                        {['accepted', 'assigned', 'on_the_way', 'arrived_at_pickup', 'trip_started'].includes(cab.cabBooking?.status) && (
                          <div className="mt-4">
                            <MiniTrackingMap cab={cab} isLoaded={isLoaded} driverLocations={driverLocations} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </motion.div>
  );
};

export default CustomerDashboard;
