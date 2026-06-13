import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const CabDriverDashboard = () => {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [requests, setRequests] = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Basic setup for MVP
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
    setSocket(newSocket);
    
    if (user?.id) {
      newSocket.emit('join_room', { role: 'provider', id: user.id });
    }

    newSocket.on('new_ride_request', (req) => {
      setRequests(prev => [...prev, req]);
      toast.info("New Ride Request!");
    });

    return () => newSocket.disconnect();
  }, [user]);

  const handleAccept = async (bookingId) => {
    try {
      const res = await api.post(`/cabs/driver/ride-requests/${bookingId}/accept`);
      setActiveRide(res.data.booking);
      setRequests(requests.filter(r => r.bookingId !== bookingId));
      toast.success("Ride Accepted!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to accept ride. May have been taken.");
    }
  };

  const updateStatus = async (status) => {
    try {
      const res = await api.patch(`/cabs/driver/rides/${activeRide._id}/status`, { status });
      setActiveRide(res.data.booking);
      toast.success(`Status updated to ${status}`);
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  // GPS Simulation Script
  useEffect(() => {
    if (!activeRide || !socket) return;
    
    const cabBooking = activeRide.cabBooking;
    if (cabBooking.cabBookingStatus === 'trip_started') {
      let progress = 0;
      const startLat = cabBooking.pickupLocation.lat;
      const startLng = cabBooking.pickupLocation.lng;
      const endLat = cabBooking.dropLocation.lat;
      const endLng = cabBooking.dropLocation.lng;

      const interval = setInterval(() => {
        progress += 0.05; // Move 5% every 2 seconds
        if (progress > 1) {
          clearInterval(interval);
          return;
        }

        const currentLat = startLat + (endLat - startLat) * progress;
        const currentLng = startLng + (endLng - startLng) * progress;

        socket.emit('driver_location_update', {
          providerId: user.id,
          lat: currentLat,
          lng: currentLng,
          customerId: activeRide.userId
        });
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [activeRide?.cabBooking?.cabBookingStatus, socket]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Driver Dashboard</h1>
          <p className="text-gray-500">Manage your rides and earnings</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="font-semibold">{isOnline ? 'Online' : 'Offline'}</span>
          <button 
            onClick={() => setIsOnline(!isOnline)}
            className={`w-14 h-7 flex items-center rounded-full p-1 transition-colors duration-300 ${isOnline ? 'bg-green-500' : 'bg-gray-300'}`}
          >
            <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${isOnline ? 'translate-x-7' : 'translate-x-0'}`}></div>
          </button>
        </div>
      </div>

      {!activeRide ? (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Incoming Requests</h2>
          {requests.length === 0 ? (
            <div className="bg-gray-50 p-12 text-center rounded-xl border border-gray-200 border-dashed">
              <p className="text-gray-500">No ride requests currently.</p>
            </div>
          ) : (
            requests.map((req) => (
              <div key={req.bookingId} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                <div>
                  <p className="font-bold">{req.distanceKm.toFixed(1)} km Trip</p>
                  <p className="text-sm text-gray-500">Est. Fare: ₹{req.estimatedFare}</p>
                </div>
                <button 
                  onClick={() => handleAccept(req.bookingId)}
                  className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-light transition"
                >
                  Accept Ride
                </button>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow-sm border-2 border-primary space-y-6">
          <h2 className="text-xl font-bold text-primary">Active Ride</h2>
          
          <div className="grid grid-cols-2 gap-4">
             <button onClick={() => updateStatus('arrived_at_pickup')} className="p-3 bg-gray-100 hover:bg-gray-200 rounded font-semibold transition">Arrived at Pickup</button>
             <button onClick={() => updateStatus('trip_started')} className="p-3 bg-gray-100 hover:bg-gray-200 rounded font-semibold transition">Start Trip</button>
             <button onClick={() => updateStatus('completed')} className="col-span-2 p-4 bg-green-600 text-white hover:bg-green-700 rounded-lg font-bold transition">Complete Trip & Collect Cash</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CabDriverDashboard;
