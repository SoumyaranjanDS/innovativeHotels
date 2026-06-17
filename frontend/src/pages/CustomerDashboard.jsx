import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { MapPin, Calendar, Star, ChevronRight, Hotel, Car, Clock, X, Download, AlertCircle } from 'lucide-react';
import { useLoadScript, GoogleMap, DirectionsRenderer, Marker } from '@react-google-maps/api';
import { io } from 'socket.io-client';
import ReviewForm from '../components/booking/ReviewForm';

const libraries = ['places'];

const CustomerDashboard = () => {
  const [hotelBookings, setHotelBookings] = useState([]);
  const [cabBookings, setCabBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [driverLocations, setDriverLocations] = useState({});
  const [reviewModalData, setReviewModalData] = useState(null);

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

    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
    
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

        <div className="space-y-10">
            {/* Upcoming */}
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

            {/* Standalone Cab Bookings */}
            {cabBookings.filter(b => !b.cabBooking?.hotelBookingId).length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Car size={18} className="text-indigo-500" /> Independent Cab Rides</h2>
                <div className="space-y-4">
                  {cabBookings.filter(b => !b.cabBooking?.hotelBookingId).map((b) => (
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
                      <div className="text-right flex flex-col items-end gap-2">
                        <p className="text-xl font-bold text-gray-900">₹{b.totalAmount}</p>
                        <div className="flex gap-4 items-center">
                          {b.cabBooking?.otp && (
                            <div className="text-right">
                              <p className="text-[10px] uppercase font-bold text-gray-400">Ride OTP</p>
                              <p className="text-sm font-mono font-bold tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{b.cabBooking.otp}</p>
                            </div>
                          )}
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${b.cabBooking?.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {b.cabBooking?.status?.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        </div>
                        {/* Live Tracking Map for Active Independent Cab */}
                        {['accepted', 'assigned', 'on_the_way', 'arrived_at_pickup', 'trip_started'].includes(b.cabBooking?.status) && (
                          <div className="w-full mt-2">
                            <MiniTrackingMap cab={b} isLoaded={isLoaded} driverLocations={driverLocations} />
                          </div>
                        )}
                        {!['completed', 'cancelled', 'rejected'].includes(b.cabBooking?.status) && (
                          <div className="mt-2">
                            <Link to={`/cab-tracking/${b._id}`} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition">
                              Track Ride
                            </Link>
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

const BookingCard = ({ booking, getStatusColor, formatStatus, showActions, showReview, associatedCabs = [], isLoaded, driverLocations }) => {
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
          <div className="md:w-48 h-36 md:h-auto flex-shrink-0">
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
                  <Link to={`/hotel-booking/${booking._id}`} className="px-4 py-2 bg-accent/10 text-accent rounded-lg text-sm font-semibold hover:bg-accent/20 transition">
                    Review
                  </Link>
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
                      {/* Live Tracking Map for Active Linked Cab */}
                      {['accepted', 'assigned', 'on_the_way', 'arrived_at_pickup', 'trip_started'].includes(cab.cabBooking?.status) && (
                        <MiniTrackingMap cab={cab} isLoaded={isLoaded} driverLocations={driverLocations} />
                      )}
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
