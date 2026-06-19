import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLoadScript, GoogleMap, DirectionsRenderer, Marker } from '@react-google-maps/api';
import { io } from 'socket.io-client';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { CheckCircle, XCircle, User as UserIcon, Phone, Car, Star } from 'lucide-react';

const libraries = ['places'];
const mapContainerStyle = { width: '100%', height: '100%' };

const CabLiveTracking = () => {
  const { bookingId } = useParams();
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries
  });

  const [booking, setBooking] = useState(null);
  const [directions, setDirections] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [status, setStatus] = useState('requested');

  useEffect(() => {
    // 1. Fetch booking details
    const fetchBooking = async () => {
      try {
        const res = await api.get(`/bookings/${bookingId}`);
        setBooking(res.data.data);
        if (res.data.data.cabBooking) {
            setStatus(res.data.data.cabBooking.status);
            // If already on the way, we might need driver location. Let's assume we fetch it via socket later.
        }
      } catch (err) {
        toast.error("Failed to load booking details");
      }
    };
    fetchBooking();

    // 2. Setup Sockets
    const socket = io(import.meta.env.PROD ? import.meta.env.VITE_API_URL : 'http://localhost:5000');
    
    const userId = JSON.parse(localStorage.getItem('user'))?.id;
    if (userId) {
      socket.emit('join_room', { role: 'user', id: userId });
    }

    socket.on('ride_accepted', (data) => {
      if (data.bookingId === bookingId) {
        setStatus('accepted');
        toast.success(`A driver has accepted your ride!`);
      }
    });

    socket.on('ride_status_changed', (data) => {
      if (data.bookingId === bookingId) {
        setStatus(data.status);
      }
    });

    socket.on('cab_location_updated', (loc) => {
      setDriverLocation(loc); // {lat, lng}
    });

    socket.on('ride_cancelled', (data) => {
      if (data.bookingId === bookingId) {
        setStatus('cancelled');
        toast.error('The ride has been cancelled.');
      }
    });

    return () => socket.disconnect();
  }, [bookingId]);

  const handleCancelRide = async () => {
    if (!window.confirm("Are you sure you want to cancel this ride?")) return;
    try {
      await api.post(`/cabs/${bookingId}/cancel`);
      toast.success("Ride cancelled successfully");
      setStatus('cancelled');
      // Optionally navigate away after a delay
      setTimeout(() => window.location.href = '/customer-dashboard', 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel ride");
    }
  };

  useEffect(() => {
    if (!window.google || !booking?.cabBooking) return;
    const calculateRoute = () => {
      const directionsService = new window.google.maps.DirectionsService();
      let origin, destination;

      if (['assigned', 'on_the_way', 'arrived_at_pickup'].includes(status)) {
        // Driver to Pickup (using a slight offset for demo if driverLocation is not yet live)
        const dLoc = driverLocation || { 
          lat: booking.cabBooking.pickupLocation.lat - 0.01, 
          lng: booking.cabBooking.pickupLocation.lng - 0.01 
        };
        origin = dLoc;
        destination = booking.cabBooking.pickupLocation;
      } else if (['trip_started', 'completed'].includes(status)) {
        // Pickup to Drop
        origin = booking.cabBooking.pickupLocation;
        destination = booking.cabBooking.dropLocation;
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
    };

    calculateRoute();
  }, [booking, status, driverLocation]);

  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 bg-white shadow-sm z-10 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Ride #{bookingId.slice(-6).toUpperCase()}</h1>
          <p className="text-sm font-medium text-primary uppercase tracking-widest">{status.replace(/_/g, ' ')}</p>
        </div>
        <div className="text-right">
          {booking?.cabBooking?.otp && ['accepted', 'assigned', 'on_the_way', 'arrived_at_pickup'].includes(status) && (
            <div className="mb-2">
              <p className="font-bold text-xs text-gray-500 uppercase tracking-wider">Your Ride OTP</p>
              <p className="text-xl font-mono font-bold tracking-widest text-primary bg-primary/10 inline-block px-3 py-1 rounded">{booking.cabBooking.otp}</p>
            </div>
          )}
          <p className="font-bold">Payment Mode</p>
          <p className="text-sm text-gray-500">Cash on Delivery</p>
        </div>
      </div>
      
      <div className="flex-1 relative">
        <GoogleMap 
          mapContainerStyle={mapContainerStyle}
          zoom={booking ? 14 : 13}
          center={driverLocation || (booking ? booking.cabBooking.pickupLocation : { lat: 20.5937, lng: 78.9629 })} 
        >
          {directions && <DirectionsRenderer directions={directions} />}
          {booking && <Marker position={booking.cabBooking.pickupLocation} label="P" />}
          {booking && <Marker position={booking.cabBooking.dropLocation} label="D" />}
          {driverLocation && <Marker position={driverLocation} icon={{ url: '/car-icon.png', scaledSize: new window.google.maps.Size(40, 40) }} />}
        </GoogleMap>

        {status === 'requested' && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20">
            <div className="bg-white p-8 rounded-2xl shadow-xl text-center space-y-4">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-xl font-bold">Request Received</h3>
              <p className="text-gray-500 max-w-sm mb-6">Your cab request has been sent to the provider. They will manually assign a driver before your pickup time.</p>
              
              <div className="flex gap-4 w-full mt-4">
                <button 
                  onClick={() => window.location.href = '/customer-dashboard'}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition"
                >
                  My Bookings
                </button>
                <button 
                  onClick={handleCancelRide}
                  className="flex-1 px-6 py-3 bg-red-100 text-red-600 rounded-xl font-bold hover:bg-red-200 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {status === 'cancelled' && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20">
            <div className="bg-white p-8 rounded-2xl shadow-xl text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle size={32} />
              </div>
              <h3 className="text-xl font-bold">Ride Cancelled</h3>
              <p className="text-gray-500 max-w-sm mb-6">This ride has been cancelled.</p>
              <button 
                onClick={() => window.location.href = '/customer-dashboard'}
                className="w-full mt-4 px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition"
              >
                Go Back
              </button>
            </div>
          </div>
        )}

        {/* Driver Details Overlay */}
        {booking?.cabBooking?.vendorId && ['accepted', 'assigned', 'on_the_way', 'arrived_at_pickup', 'trip_started'].includes(status) && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden z-20 border border-gray-100">
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-primary/20">
                    {booking.cabBooking.vendorId.vendorDetails?.driverPhoto ? (
                      <img src={booking.cabBooking.vendorId.vendorDetails.driverPhoto} alt="Driver" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon size={24} className="text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{booking.cabBooking.vendorId.vendorDetails?.driverName || booking.cabBooking.vendorId.businessName || 'Your Driver'}</h3>
                    <div className="flex items-center gap-1 text-gray-500 text-sm mt-0.5">
                      <Star size={14} className="text-yellow-500 fill-yellow-500" /> 4.8
                    </div>
                  </div>
                </div>
                {booking.cabBooking.vendorId.vendorDetails?.mobile && (
                  <a href={`tel:${booking.cabBooking.vendorId.vendorDetails.mobile}`} className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center hover:bg-green-200 transition">
                    <Phone size={18} />
                  </a>
                )}
              </div>

              {booking.cabBooking.vehicleId && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Vehicle</p>
                    <p className="font-semibold text-gray-800">{booking.cabBooking.vehicleId.make} {booking.cabBooking.vehicleId.model}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Plate</p>
                    <p className="font-mono font-bold bg-yellow-100 px-2 py-0.5 rounded text-gray-800 border border-yellow-200">{booking.cabBooking.vehicleId.registrationNumber}</p>
                  </div>
                </div>
              )}

              {/* Cancel Button in active ride */}
              {!['trip_started', 'completed'].includes(status) && (
                <button 
                  onClick={handleCancelRide}
                  className="w-full mt-4 py-2 border-2 border-red-100 text-red-500 rounded-xl font-bold hover:bg-red-50 transition"
                >
                  Cancel Ride
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CabLiveTracking;
