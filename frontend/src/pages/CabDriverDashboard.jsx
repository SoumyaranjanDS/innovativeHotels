import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { GoogleMap, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api';
import { MapPin, Navigation, CheckCircle, Clock } from 'lucide-react';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.75rem'
};

const center = { lat: 20.5937, lng: 78.9629 }; // Default India

const CabDriverDashboard = () => {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [requests, setRequests] = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const [socket, setSocket] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  
  // Directions state
  const [directions, setDirections] = useState(null);
  
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  // Fetch initial state
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [activeRes, reqsRes] = await Promise.all([
          api.get('/cabs/driver/rides/current'),
          api.get('/cabs/driver/ride-requests')
        ]);
        if (activeRes.data.activeRide) {
          setActiveRide(activeRes.data.activeRide);
        }
        if (reqsRes.data.requests) {
          setRequests(reqsRes.data.requests);
        }
      } catch (err) {
        console.error("Failed to load dashboard data");
      }
    };
    fetchData();
  }, []);

  // Location Tracking
  useEffect(() => {
    if (!isOnline) return;

    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
          try {
            await api.patch('/cabs/driver/location', { lat: latitude, lng: longitude });
          } catch (e) {
            console.error("Failed to update location");
          }
        },
        (error) => console.error("Error getting location", error),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [isOnline]);

  // Socket
  useEffect(() => {
    const newSocket = io(import.meta.env.PROD ? import.meta.env.VITE_API_URL : 'http://localhost:5000');
    setSocket(newSocket);
    
    if (user?.id) {
      newSocket.emit('join_room', { role: 'provider', id: user.id });
    }

    newSocket.on('new_ride_request', (req) => {
      setRequests(prev => {
        if(prev.find(r => r.bookingId === req.bookingId)) return prev;
        return [...prev, req];
      });
      toast.info("New Ride Request!");
    });

    return () => newSocket.disconnect();
  }, [user]);

  // Navigation Logic
  useEffect(() => {
    if (!isLoaded || !activeRide || !currentLocation) return;
    
    const directionsService = new window.google.maps.DirectionsService();
    const pickup = activeRide.cabBooking.pickupLocation;
    const drop = activeRide.cabBooking.dropLocation;
    const status = activeRide.cabBooking.status;

    let origin = currentLocation;
    let destination = pickup;

    // Stage 2 Navigation: Pickup to Drop
    if (['trip_started'].includes(status)) {
        origin = currentLocation; // or pickup if we just want to show the full route
        destination = drop;
    }

    directionsService.route(
      {
        origin: new window.google.maps.LatLng(origin.lat, origin.lng),
        destination: new window.google.maps.LatLng(destination.lat, destination.lng),
        travelMode: window.google.maps.TravelMode.DRIVING
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);
        } else {
          console.error(`error fetching directions ${result}`);
        }
      }
    );
  }, [isLoaded, activeRide, currentLocation, activeRide?.cabBooking?.status]);

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
      const payload = { status };
      if (currentLocation) {
        payload.lat = currentLocation.lat;
        payload.lng = currentLocation.lng;
      }
      const res = await api.patch(`/cabs/driver/rides/${activeRide._id}/status`, payload);
      setActiveRide(res.data.booking);
      toast.success(`Status updated to ${status.replace(/_/g, ' ')}`);
      if (status === 'completed') {
        setActiveRide(null);
        setDirections(null);
        toast.info("Please collect Cash on Delivery (COD).");
      }
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Driver Dashboard</h1>
          <p className="text-gray-500">Manage your rides and navigate</p>
        </div>
        <div className="flex items-center space-x-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
          <span className="font-semibold text-gray-700">{isOnline ? 'Online' : 'Offline'}</span>
          <button 
            onClick={() => setIsOnline(!isOnline)}
            className={`w-14 h-7 flex items-center rounded-full p-1 transition-colors duration-300 ${isOnline ? 'bg-green-500' : 'bg-gray-300'}`}
          >
            <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${isOnline ? 'translate-x-7' : 'translate-x-0'}`}></div>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Active Ride / Map */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {activeRide ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
              <div className="p-4 md:p-6 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-indigo-900">Active Ride</h2>
                  <p className="text-indigo-700 font-medium capitalize text-sm">Status: {activeRide.cabBooking.status.replace(/_/g, ' ')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-indigo-600 font-bold uppercase">Estimated Fare</p>
                  <p className="text-2xl font-black text-indigo-900">₹{activeRide.totalAmount}</p>
                </div>
              </div>
              
              <div className="bg-gray-50 border-b border-gray-100 h-[50vh] md:h-[400px] relative">
                {isLoaded ? (
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={currentLocation || center}
                    zoom={14}
                    options={{ disableDefaultUI: true, zoomControl: true }}
                  >
                    {directions && <DirectionsRenderer directions={directions} options={{ polylineOptions: { strokeColor: '#4f46e5', strokeWeight: 5 } }} />}
                  </GoogleMap>
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-200">Loading Map...</div>
                )}
              </div>

              <div className="p-4 md:p-6">
                <div className="flex flex-col gap-4 mb-8">
                  <div className="flex gap-4 items-start">
                    <div className="mt-1 bg-blue-100 p-2 rounded-full text-blue-600">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-500 uppercase">Pickup</p>
                      <p className="text-gray-900 font-medium">{activeRide.cabBooking.pickupLocation.address || 'Pickup Location'}</p>
                    </div>
                  </div>
                  <div className="border-l-2 border-dashed border-gray-200 ml-5 h-6"></div>
                  <div className="flex gap-4 items-start">
                    <div className="mt-1 bg-green-100 p-2 rounded-full text-green-600">
                      <Navigation size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-500 uppercase">Drop</p>
                      <p className="text-gray-900 font-medium">{activeRide.cabBooking.dropLocation.address || 'Drop Location'}</p>
                    </div>
                  </div>
                </div>

                {activeRide.userId && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">Customer Details</p>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                        {activeRide.userId.name ? activeRide.userId.name.charAt(0).toUpperCase() : <UserIcon size={20} />}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{activeRide.userId.name}</p>
                        <p className="text-xs text-gray-500">{activeRide.userId.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <a href={`tel:${activeRide.userId.mobile}`} className="flex-1 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-center hover:bg-gray-50 transition text-gray-700">
                        📞 Call {activeRide.userId.mobile}
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  {['accepted', 'assigned'].includes(activeRide.cabBooking.status) && (
                    <button onClick={() => updateStatus('on_the_way')} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition">
                      Start towards Pickup
                    </button>
                  )}
                  {activeRide.cabBooking.status === 'on_the_way' && (
                    <button onClick={() => updateStatus('arrived_at_pickup')} className="w-full py-3 bg-yellow-500 text-white rounded-xl font-bold hover:bg-yellow-600 transition">
                      Arrived at Pickup
                    </button>
                  )}
                  {activeRide.cabBooking.status === 'arrived_at_pickup' && (
                    <button onClick={() => updateStatus('trip_started')} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition">
                      Start Trip
                    </button>
                  )}
                  {activeRide.cabBooking.status === 'trip_started' && (
                    <button onClick={() => updateStatus('completed')} className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition">
                      Complete Trip
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-300 p-12 text-center flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4 text-gray-400">
                <Navigation size={32} />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">No Active Ride</h2>
              <p className="text-gray-500 max-w-md mx-auto">You don't have an ongoing trip right now. Turn on your availability to receive new ride requests.</p>
            </div>
          )}
        </div>

        {/* Right Column: Ride Requests */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Clock size={20} className="text-primary" />
            Ride Requests
          </h2>

          {!isOnline ? (
            <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-xl text-center">
              <p className="text-yellow-800 font-medium">Go online to receive requests</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-white border border-gray-100 p-8 rounded-xl text-center shadow-sm">
              <div className="animate-pulse w-12 h-12 bg-indigo-100 rounded-full mx-auto mb-4 flex items-center justify-center text-indigo-500">
                <div className="w-4 h-4 bg-indigo-500 rounded-full"></div>
              </div>
              <p className="text-gray-500 font-medium">Waiting for rides...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req, index) => (
                <div key={index} className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm hover:border-primary transition group relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                  
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-bold uppercase tracking-wider">
                      {req.distanceKm} km
                    </span>
                    <span className="font-black text-gray-900">₹{req.estimatedFare}</span>
                  </div>
                  
                  <div className="space-y-3 mb-5">
                    <div className="flex gap-3">
                      <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 shrink-0"></div>
                      <p className="text-sm text-gray-600 line-clamp-1" title={req.pickupLocation?.address}>{req.pickupLocation?.address || 'Pickup'}</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="mt-1 w-2 h-2 rounded-full bg-green-500 shrink-0"></div>
                      <p className="text-sm text-gray-600 line-clamp-1" title={req.dropLocation?.address}>{req.dropLocation?.address || 'Drop'}</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleAccept(req.bookingId)}
                    disabled={activeRide}
                    className="w-full py-2 bg-gray-900 text-white rounded-lg font-bold text-sm hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={16} /> Accept Ride
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CabDriverDashboard;
