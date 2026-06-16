import React, { useState, useEffect } from 'react';
import { Car, MapPin, Navigation, Phone, CheckCircle, Navigation2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { toast } from 'react-toastify';

const DriverDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [activeRide, setActiveRide] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Profile and Vehicle
      const profileRes = await api.get('/cabs/driver/profile');
      setProfile(profileRes.data.data.vendor);
      setVehicle(profileRes.data.data.vehicle);

      // 2. Fetch Active Ride
      const rideRes = await api.get('/cabs/driver/rides/current');
      setActiveRide(rideRes.data.activeRide);

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

  const handleUpdateStatus = async (newStatus) => {
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

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto mt-8 mb-12">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
          <Car size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-800">Driver Portal</h1>
          <p className="text-gray-500">Manage your rides and vehicle</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Vehicle & Profile */}
        <div className="lg:col-span-1 space-y-6">
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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full">
            <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
              <span className="font-bold text-gray-700">Active Ride</span>
              {activeRide && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold uppercase tracking-wider">
                  {activeRide.cabBooking?.status?.replace(/_/g, ' ')}
                </span>
              )}
            </div>
            
            <div className="p-8 h-full flex flex-col">
              {activeRide ? (
                <div className="flex-1 flex flex-col">
                  {/* Ride Header */}
                  <div className="flex justify-between items-start mb-8 pb-6 border-b border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Booking ID</p>
                      <p className="font-mono font-bold text-gray-800 text-lg">{activeRide.bookingId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Estimated Fare</p>
                      <p className="font-bold text-green-600 text-2xl">₹{activeRide.totalAmount}</p>
                      <p className="text-xs text-gray-500 mt-1">Payment: {activeRide.paymentMode?.toUpperCase()}</p>
                    </div>
                  </div>

                  {/* Route */}
                  <div className="relative pl-8 space-y-8 mb-10">
                    <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200"></div>
                    
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

                  {/* Passenger Info */}
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-blue-800 uppercase font-bold mb-1">Passenger</p>
                      <p className="font-bold text-blue-900">{activeRide.userId?.name || 'Customer'}</p>
                      <p className="text-sm text-blue-700">{activeRide.cabBooking?.passengers} Passenger(s)</p>
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
                        onClick={() => handleUpdateStatus('trip_started')}
                        disabled={updating}
                        className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition flex justify-center items-center gap-2"
                      >
                        <Navigation2 size={20} /> Start Trip
                      </button>
                    )}
                    {activeRide.cabBooking?.status === 'trip_started' && (
                      <button 
                        onClick={() => handleUpdateStatus('completed')}
                        disabled={updating}
                        className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition flex justify-center items-center gap-2"
                      >
                        <CheckCircle size={20} /> Complete Trip & Collect ₹{activeRide.totalAmount}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
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
    </div>
  );
};

export default DriverDashboard;
