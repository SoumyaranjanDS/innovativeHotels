import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLoadScript, GoogleMap, DirectionsRenderer, Marker } from '@react-google-maps/api';
import { io } from 'socket.io-client';
import api from '../api/axios';
import { toast } from 'react-toastify';

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
    // For MVP we mock the exact API endpoint if it's not created yet, or use the existing
    const fetchBooking = async () => {
      // NOTE: Assume we have an endpoint GET /api/cabs/bookings/:id
      // For now, we wait for sockets
    };
    fetchBooking();

    // 2. Setup Sockets
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
    
    // Assume user ID is 123 for now since we don't have auth context imported here directly,
    // In real app, get from AuthContext
    const userId = JSON.parse(localStorage.getItem('user'))?.id;
    if (userId) socket.emit('join_room', { role: 'user', id: userId });

    socket.on('ride_accepted', (data) => {
      if (data.bookingId === bookingId) {
        setStatus('accepted');
        toast.success(`Driver ${data.driverInfo.driverName} has accepted your ride!`);
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
          zoom={13}
          center={driverLocation || { lat: 20.5937, lng: 78.9629 }} // Fallback center
        >
          {directions && <DirectionsRenderer directions={directions} />}
          {driverLocation && <Marker position={driverLocation} icon={{ url: '/car-icon.png', scaledSize: new window.google.maps.Size(40, 40) }} />}
        </GoogleMap>

        {status === 'requested' && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white p-8 rounded-2xl shadow-xl text-center space-y-4">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              <h3 className="text-xl font-bold">Finding nearby drivers...</h3>
              <p className="text-gray-500 max-w-sm">Please wait while we match you with the best available cab near your pickup location.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CabLiveTracking;
