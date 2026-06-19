import React, { useState, useEffect } from 'react';
import { Car, MapPin, Navigation, Phone, CheckCircle, Navigation2, KeyRound, Receipt, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { useLoadScript, GoogleMap, DirectionsRenderer, Marker } from '@react-google-maps/api';

const libraries = ['places'];
const mapContainerStyle = { width: '100%', height: '100%', borderRadius: '0.75rem' };

const DriverDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [activeRide, setActiveRide] = useState(null);
  const [historyRides, setHistoryRides] = useState([]);
  const [updating, setUpdating] = useState(false);
  
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [directions, setDirections] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries
  });

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Profile and Vehicle
      const profileRes = await api.get('/cabs/driver/profile');
      setProfile(profileRes.data.data.vendor);
      setVehicle(profileRes.data.data.vehicle);

      // 2. Fetch Active Ride
      const rideRes = await api.get('/cabs/driver/rides/current');
      setActiveRide(rideRes.data.activeRide);

      // 3. Fetch History Rides
      const historyRes = await api.get('/cabs/driver/rides/history');
      setHistoryRides(historyRes.data.history || []);

    } catch (error) {
      console.error('Failed to load driver dashboard', error);
      // Don't show toast for 404s (e.g. no active ride)
      if (error.response?.status !== 404) {
        toast.error('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Start Location Tracking
    let watchId;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setDriverLocation(newLoc);
          api.patch('/cabs/driver/location', newLoc).catch(() => {});
        },
        (err) => console.error("Geolocation error:", err),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    }
    
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  useEffect(() => {
    const calculateRoute = () => {
      if (!window.google || !activeRide) return;
      
      const directionsService = new window.google.maps.DirectionsService();
      const status = activeRide.cabBooking?.status;
      let origin, destination;
      
      if (status === 'on_the_way') {
        // Driver to Pickup (Mocking Driver location to be near pickup for demo, or using a fixed location)
        // In a real scenario we use geolocation
        origin = { 
          lat: activeRide.cabBooking.pickupLocation.lat - 0.01, 
          lng: activeRide.cabBooking.pickupLocation.lng - 0.01 
        };
        destination = activeRide.cabBooking.pickupLocation;
      } else if (['trip_started', 'completed'].includes(status)) {
        // Pickup to Drop
        origin = activeRide.cabBooking.pickupLocation;
        destination = activeRide.cabBooking.dropLocation;
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
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            setDirections(result);
          }
        }
      );
    };

    if (isLoaded && activeRide) {
      calculateRoute();
    }
  }, [isLoaded, activeRide]);

  const handleUpdateStatus = async (newStatus) => {
    if (newStatus === 'completed' && (activeRide?.paymentMode === 'cod' || activeRide?.paymentMode === 'pay_at_hotel')) {
      if (!window.confirm(`Payment Collection Required!\n\nCash to collect: ₹${activeRide.totalAmount}\n\nPlease confirm you have collected the full cash amount from the passenger.`)) {
        return;
      }
    }
    
    setUpdating(true);
    try {
      await api.patch(`/cabs/driver/rides/${activeRide._id}/status`, {
        status: newStatus,
        lat: 0, // In a real app, we'd get actual device location
        lng: 0
      });
      toast.success('Ride status updated');
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpInput.length !== 6) return toast.error('OTP must be 6 digits');
    setUpdating(true);
    try {
      await api.post(`/cabs/driver/rides/${activeRide._id}/verify-otp`, {
        otp: otpInput,
        lat: 0,
        lng: 0
      });
      toast.success('OTP Verified! Trip Started.');
      setShowOtpModal(false);
      setOtpInput('');
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;
  }

  const isActiveTrip = activeRide && ['on_the_way', 'arrived_at_pickup', 'trip_started'].includes(activeRide.cabBooking?.status);

  const renderOtpModal = () => {
    if (!showOtpModal) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-xl">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Verify Customer</h2>
          <p className="text-gray-500 mb-6 text-sm">Ask the customer for the 6-digit OTP shown on their device.</p>
          <input 
            type="text" 
            value={otpInput}
            onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
            placeholder="000000"
            className="w-full text-center text-4xl tracking-widest font-mono border-b-2 border-gray-300 focus:border-primary outline-none py-2 mb-8"
          />
          <div className="flex gap-4">
            <button 
              onClick={() => { setShowOtpModal(false); setOtpInput(''); }} 
              className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button 
              onClick={handleVerifyOtp} 
              disabled={otpInput.length !== 6 || updating}
              className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition disabled:opacity-50"
            >
              Verify
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isActiveTrip) {
    return (
      <>
        <ActiveTripView 
          activeRide={activeRide} 
          driverLocation={driverLocation} 
          directions={directions} 
          isLoaded={isLoaded}
          handleUpdateStatus={handleUpdateStatus}
          updating={updating}
          setShowOtpModal={setShowOtpModal}
        />
        {renderOtpModal()}
      </>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-4 md:mt-8 mb-12 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 md:mb-8">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
          <Car size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-800">Driver Portal</h1>
          <p className="text-gray-500">Manage your rides and vehicle</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* Left Column: Vehicle & Profile */}
        <div className="lg:col-span-1 space-y-4 md:space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-100 font-bold text-gray-700">
              Your Profile
            </div>
            <div className="p-6">
              {profile ? (
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    {profile.vendorDetails?.driverPhoto ? (
                      <img src={profile.vendorDetails.driverPhoto} alt="Driver" className="w-16 h-16 rounded-full object-cover border border-gray-200" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xl">
                        {profile.vendorDetails?.driverName?.charAt(0) || 'D'}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-lg text-gray-800">{profile.vendorDetails?.driverName}</p>
                      <p className="text-sm text-gray-500">{profile.vendorDetails?.mobile}</p>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-center mb-2">
                    <p className="text-green-800 font-bold text-sm">Status: {profile.availability?.isAvailable ? 'Available' : 'Busy / On Trip'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Profile not found.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-100 font-bold text-gray-700">
              Assigned Vehicle
            </div>
            <div className="p-6">
              {vehicle ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Vehicle Details</p>
                    <p className="font-semibold text-gray-800 text-lg">{vehicle.details?.model}</p>
                    <p className="text-sm text-gray-600">{vehicle.details?.vehicleType} • {vehicle.details?.isAC ? 'AC' : 'Non-AC'}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Registration Number</p>
                    <p className="font-mono font-bold text-gray-800 text-lg tracking-wider">{vehicle.details?.registrationNumber}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-gray-100 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Color</p>
                      <p className="font-semibold text-gray-800">{vehicle.details?.color}</p>
                    </div>
                    <div className="border border-gray-100 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Fuel Type</p>
                      <p className="font-semibold text-gray-800">{vehicle.details?.fuelType}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No vehicle assigned yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Active Ride */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
            <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
              <span className="font-bold text-gray-700">Active Ride</span>
              {activeRide && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold uppercase tracking-wider">
                  {activeRide.cabBooking?.status?.replace(/_/g, ' ')}
                </span>
              )}
            </div>
            
            <div className="p-4 md:p-8 flex-1 flex flex-col min-h-[300px]">
              {activeRide ? (
                <div className="flex-1 flex flex-col">
                  {/* Ride Header */}
                  <div className="flex justify-between items-start mb-8 pb-6 border-b border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Booking ID</p>
                      <p className="font-mono font-bold text-gray-800 text-lg">{activeRide.bookingId}</p>
                    </div>
                  </div>

                  {/* Route & Map Area */}
                  <div className="mb-8 md:mb-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative pl-6 md:pl-8 space-y-6 md:space-y-8">
                      <div className="absolute left-[9px] md:left-[11px] top-2 bottom-2 w-0.5 bg-gray-200"></div>
                      
                      <div className="relative">
                        <div className="absolute -left-8 top-1 w-6 h-6 bg-green-100 border-2 border-green-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">Pickup</p>
                        <p className="font-semibold text-gray-800 text-lg">{activeRide.cabBooking?.pickupLocation?.address}</p>
                        <p className="text-sm text-gray-500 mt-1">{new Date(activeRide.cabBooking?.pickupDateTime).toLocaleString()}</p>
                      </div>

                      <div className="relative">
                        <div className="absolute -left-8 top-1 w-6 h-6 bg-red-100 border-2 border-red-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        </div>
                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">Drop</p>
                        <p className="font-semibold text-gray-800 text-lg">{activeRide.cabBooking?.dropLocation?.address}</p>
                        <p className="text-sm text-gray-500 mt-1">{activeRide.cabBooking?.distanceKm?.toFixed(1)} km • ~{activeRide.cabBooking?.durationMinutes} mins</p>
                      </div>
                    </div>

                    <div className="h-64 md:h-full min-h-[250px] bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                      {isLoaded ? (
                        <GoogleMap 
                          mapContainerStyle={mapContainerStyle}
                          zoom={12}
                          center={activeRide.cabBooking?.pickupLocation || { lat: 20.5937, lng: 78.9629 }}
                        >
                          {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: true }} />}
                          <Marker position={activeRide.cabBooking?.pickupLocation} label="P" />
                          <Marker position={activeRide.cabBooking?.dropLocation} label="D" />
                        </GoogleMap>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">Loading Map...</div>
                      )}
                    </div>
                  </div>

                  {/* Passenger Info */}
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 md:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <p className="text-xs text-blue-800 uppercase font-bold mb-1">Passenger</p>
                      <p className="font-bold text-blue-900">{activeRide.userId?.name || 'Customer'}</p>
                      <p className="text-sm font-medium text-blue-800 mt-1 flex items-center gap-1">
                        <Phone size={14} /> {activeRide.userId?.mobile || 'N/A'}
                      </p>
                      <p className="text-sm text-blue-700 mt-1">{activeRide.cabBooking?.passengers} Passenger(s)</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-auto grid grid-cols-1 gap-4">
                    {activeRide.cabBooking?.status === 'assigned' && (
                      <button 
                        onClick={() => handleUpdateStatus('on_the_way')}
                        disabled={updating}
                        className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-primary-light transition flex justify-center items-center gap-2"
                      >
                        <Navigation size={20} /> Start Moving to Pickup
                      </button>
                    )}
                    {activeRide.cabBooking?.status === 'on_the_way' && (
                      <button 
                        onClick={() => handleUpdateStatus('arrived_at_pickup')}
                        disabled={updating}
                        className="w-full bg-yellow-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-yellow-600 transition flex justify-center items-center gap-2"
                      >
                        <MapPin size={20} /> Arrived at Pickup
                      </button>
                    )}
                    {activeRide.cabBooking?.status === 'arrived_at_pickup' && (
                      <button 
                        onClick={() => setShowOtpModal(true)}
                        disabled={updating}
                        className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition flex justify-center items-center gap-2"
                      >
                        <KeyRound size={20} /> Verify OTP to Start Trip
                      </button>
                    )}
                    {activeRide.cabBooking?.status === 'trip_started' && (
                      <button 
                        onClick={() => handleUpdateStatus('completed')}
                        disabled={updating}
                        className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition flex justify-center items-center gap-2"
                      >
                        <CheckCircle size={20} /> Complete Trip
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center text-gray-500 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 p-6 m-0 md:m-4">
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-white shadow-sm border border-gray-100 rounded-full flex items-center justify-center mb-6">
                    <Car size={48} className="text-gray-300" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-700 mb-2">No Active Rides</h3>
                  <p className="max-w-xs mx-auto">You currently don't have any assigned rides. Waiting for new assignments...</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* History Rides Section */}
      <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Completed Rides</h2>
          <span className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full font-medium">{historyRides.length} Total</span>
        </div>
        
        {historyRides.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-left text-xs uppercase font-bold text-gray-500">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Pickup</th>
                  <th className="px-6 py-4">Drop</th>
                  <th className="px-6 py-4">Fare</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {historyRides.map(ride => (
                  <tr key={ride._id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                      {new Date(ride.cabBooking?.completedAt || ride.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700 max-w-[200px] truncate" title={ride.cabBooking?.pickupLocation?.address}>
                        {ride.cabBooking?.pickupLocation?.address?.split(',')[0]}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700 max-w-[200px] truncate" title={ride.cabBooking?.dropLocation?.address}>
                        {ride.cabBooking?.dropLocation?.address?.split(',')[0]}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-800">₹{ride.totalAmount}</p>
                      <p className="text-xs text-gray-500">{ride.paymentMode === 'cod' ? 'Cash' : 'Online'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        ride.cabBooking?.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {ride.cabBooking?.status === 'completed' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        {ride.cabBooking?.status === 'completed' ? 'Completed' : 'Cancelled'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <Receipt className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-600 font-medium">No completed rides yet.</p>
          </div>
        )}
      </div>

      {/* OTP Modal */}
      {renderOtpModal()}
    </div>
  );
};

// Component for the Active Trip full screen view
const ActiveTripView = ({ activeRide, driverLocation, directions, isLoaded, handleUpdateStatus, updating, setShowOtpModal }) => {
  const mapCenter = driverLocation || activeRide?.cabBooking?.pickupLocation || { lat: 20.5937, lng: 78.9629 };
  
  return (
    <div className="fixed inset-0 z-40 bg-gray-100 flex flex-col md:flex-row">
      {/* Map Area */}
      <div className="flex-1 h-[60vh] md:h-full relative">
        {isLoaded ? (
          <GoogleMap 
            mapContainerStyle={{ width: '100%', height: '100%' }}
            zoom={14}
            center={mapCenter}
            options={{ disableDefaultUI: true, zoomControl: true }}
          >
            {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: true, polylineOptions: { strokeColor: '#4f46e5', strokeWeight: 5 } }} />}
            <Marker position={activeRide?.cabBooking?.pickupLocation} icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png' }} label="P" />
            <Marker position={activeRide?.cabBooking?.dropLocation} icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' }} label="D" />
            {driverLocation && (
              <Marker 
                position={driverLocation} 
                icon={{
                  path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                  scale: 6,
                  fillColor: "#4f46e5",
                  fillOpacity: 1,
                  strokeWeight: 2,
                  strokeColor: "#ffffff",
                  rotation: 0 // In a real app, calculate heading
                }} 
              />
            )}
          </GoogleMap>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-200">Loading Navigation...</div>
        )}
        
        {/* Top Floating Status */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-gray-100 flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-bold text-gray-800 tracking-wide uppercase text-sm">
            {activeRide?.cabBooking?.status?.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* Bottom Sheet / Sidebar */}
      <div className="h-[40vh] md:h-full md:w-96 bg-white shadow-2xl flex flex-col z-50 rounded-t-3xl md:rounded-none">
        {/* Mobile Drag Handle */}
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-4 md:hidden"></div>
        
        <div className="p-6 flex-1 flex flex-col overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Active Trip</h2>
            <p className="text-gray-500 font-mono text-sm">ID: {activeRide?.bookingId}</p>
          </div>

          <div className="space-y-6 flex-1">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                <Navigation2 size={24} />
              </div>
              <div>
                <p className="text-xs text-blue-800 uppercase font-bold mb-1">Passenger</p>
                <p className="font-bold text-blue-900">{activeRide?.userId?.name || 'Customer'}</p>
                <p className="text-sm font-medium text-blue-800 mt-1 flex items-center gap-1">
                  <Phone size={14} /> {activeRide?.userId?.mobile || 'N/A'}
                </p>
                <p className="text-sm text-blue-700 mt-1">{activeRide?.cabBooking?.passengers} Passenger(s)</p>
              </div>
            </div>

            <div className="relative pl-8 space-y-6">
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200"></div>
              
              <div className="relative">
                <div className="absolute -left-8 top-1 w-6 h-6 bg-green-100 border-2 border-green-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Pickup</p>
                <p className="font-semibold text-gray-800 text-sm line-clamp-2">{activeRide?.cabBooking?.pickupLocation?.address}</p>
              </div>

              <div className="relative">
                <div className="absolute -left-8 top-1 w-6 h-6 bg-red-100 border-2 border-red-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                </div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Drop</p>
                <p className="font-semibold text-gray-800 text-sm line-clamp-2">{activeRide?.cabBooking?.dropLocation?.address}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            {activeRide?.cabBooking?.status === 'on_the_way' && (
              <button 
                onClick={() => handleUpdateStatus('arrived_at_pickup')}
                disabled={updating}
                className="w-full bg-yellow-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-yellow-600 transition shadow-lg shadow-yellow-500/30 flex justify-center items-center gap-2"
              >
                <MapPin size={20} /> Arrived at Pickup
              </button>
            )}
            {activeRide?.cabBooking?.status === 'arrived_at_pickup' && (
              <button 
                onClick={() => setShowOtpModal(true)}
                disabled={updating}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-lg shadow-blue-600/30 flex justify-center items-center gap-2"
              >
                <KeyRound size={20} /> Verify OTP to Start Trip
              </button>
            )}
            {activeRide?.cabBooking?.status === 'trip_started' && (
              <button 
                onClick={() => handleUpdateStatus('completed')}
                disabled={updating}
                className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition shadow-lg shadow-green-600/30 flex justify-center items-center gap-2"
              >
                <CheckCircle size={20} /> Complete Trip
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;
