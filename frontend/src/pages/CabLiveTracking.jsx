import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLoadScript, GoogleMap, DirectionsRenderer, Marker } from '@react-google-maps/api';
import { io } from 'socket.io-client';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { CheckCircle } from 'lucide-react';

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
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
    
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

    return () => socket.disconnect();
  }, [bookingId]);

  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 bg-white shadow-sm z-10 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Ride #{bookingId.slice(-6).toUpperCase()}</h1>
          <p className="text-sm font-medium text-primary uppercase tracking-widest">{status.replace(/_/g, ' ')}</p>
        </div>
        <div className="text-right">
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
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white p-8 rounded-2xl shadow-xl text-center space-y-4">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-xl font-bold">Request Received</h3>
              <p className="text-gray-500 max-w-sm mb-6">Your cab request has been sent to the hotel. They will manually assign a driver before your pickup time.</p>
              
              <button 
                onClick={() => window.location.href = '/dashboard'}
                className="w-full mt-4 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition"
              >
                Go to My Bookings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CabLiveTracking;
