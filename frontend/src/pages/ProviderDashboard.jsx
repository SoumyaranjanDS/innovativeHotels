import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const ProviderDashboard = () => {
  const { activeService } = useOutletContext();
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [hotelCabs, setHotelCabs] = useState([]);
  const [hotelCabBookings, setHotelCabBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [allPlatformCabs, setAllPlatformCabs] = useState([]);
  const [allPlatformVehicles, setAllPlatformVehicles] = useState([]);
  const [fareRules, setFareRules] = useState([]);
  const [metrics, setMetrics] = useState({ totalRevenue: '0.00', activeBookings: 0, pendingRequests: 0 });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Cab Details Modal
  const [selectedCab, setSelectedCab] = useState(null);
  const [showCabDetails, setShowCabDetails] = useState(false);
  const [isEditingCab, setIsEditingCab] = useState(false);
  const [editCabForm, setEditCabForm] = useState(null);
  const [editCabUploading, setEditCabUploading] = useState(false);

  // Cab Assignment
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedCabRequest, setSelectedCabRequest] = useState(null);
  const [assignFormData, setAssignFormData] = useState({ vendorId: '' });
  const [assigningLoading, setAssigningLoading] = useState(false);

  // Cab OTP & Status
  const [cabOtp, setCabOtp] = useState('');
  const [verifyingCabOtp, setVerifyingCabOtp] = useState(false);
  const [completingTrip, setCompletingTrip] = useState(false);

  const fetchData = async () => {
    try {
      const statusRes = await api.get('/providers/status');
      setStatus(statusRes.data.data || statusRes.data.profile);

      try {
        const metricsRes = await api.get('/providers/metrics');
        setMetrics(metricsRes.data.metrics);
      } catch(e) { console.error("Error fetching metrics"); }

      if (activeService === 'hotel') {
        try {
          const hotelRes = await api.get('/providers/hotel');
          setHotel(hotelRes.data.hotel);
        } catch (e) {
          console.log("No hotel found or error fetching hotel");
        }
      }
      
      // Always fetch hotel cabs to display in cab tab
      try {
        const cabsRes = await api.get('/hotel-cabs');
        setHotelCabs(cabsRes.data.cabs);
        if (cabsRes.data.vehicles) {
          setVehicles(cabsRes.data.vehicles);
        }
        if (cabsRes.data.fareRules) {
          setFareRules(cabsRes.data.fareRules);
        }
      } catch (e) {
        console.log("No hotel cabs yet");
      }

      // Fetch all available drivers in the platform for assignment
      try {
        const allCabsRes = await api.get('/hotel-cabs/all-available-cabs');
        if (allCabsRes.data.cabs) setAllPlatformCabs(allCabsRes.data.cabs);
        if (allCabsRes.data.vehicles) setAllPlatformVehicles(allCabsRes.data.vehicles);
      } catch (e) {
        console.log("Failed to fetch all platform cabs");
      }

      // Fetch hotel cab bookings
      if (activeService === 'cab' || activeService === 'hotel') {
        try {
          const bookingsRes = await api.get('/hotel-cabs/bookings');
          setHotelCabBookings(bookingsRes.data.data);
        } catch (e) {
          console.log("Error fetching hotel cab bookings");
        }
      }
    } catch (error) {
      console.error("Failed to fetch provider dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeService]);

  const handleDeleteCab = async (id) => {
    if (!window.confirm('Are you sure you want to delete this cab?')) return;
    try {
      await api.delete(`/hotel-cabs/${id}`);
      toast.success('Cab deleted successfully');
      setShowCabDetails(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete cab');
    }
  };

  const handleUpdateCab = async (e) => {
    e.preventDefault();
    setEditCabUploading(true);
    try {
      const payload = {
        driverDetails: {
          driverName: editCabForm.vendorDetails.driverName,
          mobile: editCabForm.vendorDetails.mobile,
          email: editCabForm.vendorDetails.email,
          address: editCabForm.vendorDetails.address
        },
        vehicleDetails: {
          vehicleType: editCabForm.vehicleDetails.vehicleType,
          model: editCabForm.vehicleDetails.model,
          registrationNumber: editCabForm.vehicleDetails.registrationNumber
        },
        fareSetup: {
          baseFare: editCabForm.fareSetup.baseFare,
          perKmRate: editCabForm.fareSetup.perKmRate
        }
      };
      
      await api.put(`/hotel-cabs/${selectedCab._id}`, payload);
      toast.success('Cab updated successfully');
      setIsEditingCab(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update cab');
    } finally {
      setEditCabUploading(false);
    }
  };

  const handleAssignDriver = async (e) => {
    e.preventDefault();
    if (!assignFormData.vendorId) {
      toast.error('Please select a driver');
      return;
    }
    setAssigningLoading(true);
    try {
      const selectedVehicle = vehicles.find(v => v.vendorId === assignFormData.vendorId);
      const vehicleId = selectedVehicle ? selectedVehicle._id : null;
      await api.patch(`/hotel-cabs/bookings/${selectedCabRequest._id}/assign`, {
        vendorId: assignFormData.vendorId,
        vehicleId: vehicleId
      });
      toast.success('Driver assigned successfully');
      setShowAssignModal(false);
      fetchData(); // Refresh bookings
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign driver');
    } finally {
      setAssigningLoading(false);
    }
  };

  const handleVerifyCabOtp = async (bookingId) => {
    if (!cabOtp || cabOtp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP.");
      return;
    }
    setVerifyingCabOtp(true);
    try {
      await api.patch(`/hotel-cabs/bookings/${bookingId}/verify-otp`, { otp: cabOtp });
      toast.success("OTP Verified! Trip Started.");
      setCabOtp('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid OTP.");
    } finally {
      setVerifyingCabOtp(false);
    }
  };

  const handleCompleteCabTrip = async (bookingId) => {
    setCompletingTrip(true);
    try {
      await api.patch(`/hotel-cabs/bookings/${bookingId}/status`, { status: 'completed' });
      toast.success("Trip completed successfully.");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to complete trip.");
    } finally {
      setCompletingTrip(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;

  // Determine if the current active service is actually registered
  const isHotelActive = status?.hotelService?.status && status.hotelService.status !== 'draft';
  const isCabActive = status?.cabService?.status && status.cabService.status !== 'draft';
  
  const showHotelOnboarding = activeService === 'hotel' && !isHotelActive;
  const showCabOnboarding = activeService === 'cab' && !isCabActive;

  return (
    <div>
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium mb-1">Today's Revenue</h3>
          <p className="text-3xl font-bold text-gray-900">₹{metrics.totalRevenue}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium mb-1">Active Bookings</h3>
          <p className="text-3xl font-bold text-gray-900">{metrics.activeBookings}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium mb-1">Pending Requests</h3>
          <p className="text-3xl font-bold text-gray-900">{metrics.pendingRequests}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium mb-1">Profile Status</h3>
          <p className={`text-lg font-bold capitalize ${status?.status === 'active' ? 'text-green-600' : 'text-yellow-600'}`}>
            {status?.status || 'Pending'}
          </p>
        </div>
      </div>

      {/* Main Area based on activeService */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 min-h-[400px] flex flex-col">
        {showHotelOnboarding && (
          <div className="text-center m-auto">
            <div className="text-6xl mb-4">🏨</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Hotel Properties Found</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">You haven't set up your hotel service yet. Complete the onboarding to start receiving bookings.</p>
            <Link to="/provider/onboarding/hotel" className="bg-primary text-white px-6 py-3 rounded-md font-semibold hover:bg-primary-light transition shadow-md">
              Start Hotel Onboarding
            </Link>
          </div>
        )}



        {activeService === 'hotel' && isHotelActive && (
          <div>
            {!hotel ? (
              <div className="p-8 text-center">Loading hotel details...</div>
            ) : hotel.status === 'rejected' ? (
              <div className="text-center m-auto py-12">
                <div className="text-6xl mb-4">❌</div>
                <h2 className="text-3xl font-bold text-red-600 mb-4">Hotel Profile Rejected</h2>
                <p className="text-lg text-gray-700 max-w-lg mx-auto">
                  Unfortunately, your hotel profile was rejected by our administration team.
                </p>
                <div className="mt-6 p-6 bg-red-50 rounded-xl border border-red-200 max-w-md mx-auto text-left">
                  <p className="text-sm font-bold text-red-800 uppercase mb-1">Reason for Rejection:</p>
                  <p className="text-red-700">{hotel.rejectionReason}</p>
                </div>
                <div className="mt-8">
                  <Link to="/provider/onboarding/hotel" className="bg-red-600 text-white px-8 py-3 rounded-md font-bold hover:bg-red-700 transition shadow-md">
                    Update Profile & Reapply
                  </Link>
                </div>
              </div>
            ) : !hotel.isApproved ? (
              <div className="text-center m-auto py-12">
                <div className="text-6xl mb-4">⏳</div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Pending Admin Approval</h2>
                <p className="text-lg text-gray-500 max-w-lg mx-auto">
                  Your hotel profile <strong>{hotel.profile?.hotelName}</strong> has been submitted and is currently under review by our administration team.
                </p>
                <div className="mt-8 p-6 bg-yellow-50 rounded-xl border border-yellow-100 max-w-md mx-auto">
                  <p className="text-yellow-800 font-medium">Please check back later or contact support if you have questions.</p>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-8">
                  <div className="flex gap-4 items-center">
                    {hotel.documents?.propertyPhotos?.length > 0 && (
                      <img src={hotel.documents.propertyPhotos[0]} alt="Hotel" className="w-16 h-16 rounded-md object-cover border border-gray-200" />
                    )}
                    <div>
                      <h2 className="text-3xl font-bold text-gray-800">{hotel.profile?.hotelName}</h2>
                      <p className="text-gray-500">Your hotel is approved and active.</p>
                    </div>
                  </div>
                  <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-bold text-sm">Approved</span>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                  <h3 className="text-lg font-bold text-blue-800 mb-2">Manage Your Hotel</h3>
                  <p className="text-blue-700 mb-4">Use the sidebar links to manage your rooms and view incoming bookings.</p>
                  <div className="flex justify-center gap-4">
                    <Link to="/provider/hotel/rooms" className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-light transition shadow-sm">
                      Manage Rooms
                    </Link>
                    <Link to="/provider/hotel/bookings" className="bg-white text-primary px-6 py-2 rounded-lg font-semibold border border-primary hover:bg-gray-50 transition shadow-sm">
                      View Bookings
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {(activeService === 'cab' || (activeService === 'hotel' && isHotelActive && hotel?.isApproved)) && (
          <div className={`space-y-12 ${activeService === 'hotel' ? 'mt-12 border-t-2 border-dashed border-gray-200 pt-8' : ''}`}>
            
            {/* Hotel Cabs Section - Only show in Cab tab */}
            {activeService === 'cab' && (
              <div className="border-t border-gray-100 pt-12">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    {user?.providerType === 'Cab' ? 'Your Cabs' : 'Hotel-Linked Cabs'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {user?.providerType === 'Cab' ? 'Manage your agency cabs.' : 'Manage cabs specifically linked to your hotel.'}
                  </p>
                </div>
                <Link to="/provider/onboarding/hotel-cab" className="bg-primary text-white px-4 py-2 rounded font-bold hover:bg-primary-light transition text-sm shadow-sm">
                  {user?.providerType === 'Cab' ? '+ Add Cab' : '+ Add Hotel Cab'}
                </Link>
              </div>
              
              {hotelCabs.length === 0 ? (
                <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-200">
                  <p className="text-gray-500">
                    {user?.providerType === 'Cab' ? 'No cabs added to your agency yet.' : 'No cabs linked to your hotel yet.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {hotelCabs.map(cab => (
                    <div key={cab._id} className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm flex flex-col hover:shadow-md transition">
                      <h4 className="font-bold text-lg text-gray-800">{cab.vendorDetails?.driverName}</h4>
                      <p className="text-sm text-gray-500 mb-2">{cab.vendorDetails?.mobile}</p>
                      <div className="mb-4">
                        <span className={`px-2 py-1 text-xs font-bold rounded-full uppercase ${cab.status === 'approved' ? 'bg-green-100 text-green-800' : cab.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {cab.status}
                        </span>
                      </div>
                      <div className="flex justify-between pt-4 border-t border-gray-100 mt-auto">
                        <button onClick={() => { setSelectedCab(cab); setShowCabDetails(true); }} className="text-sm text-gray-600 font-semibold hover:text-gray-900">View Details</button>
                        <button type="button" onClick={() => handleDeleteCab(cab._id)} className="text-sm text-red-600 font-semibold hover:text-red-800">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            )}

            {/* Cab Requests Section */}
            <div className={`${activeService === 'cab' ? 'border-t border-gray-100 pt-12 mt-12' : ''}`}>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Pending Cab Requests</h3>
                  <p className="text-sm text-gray-500">Assign drivers to customers requesting cabs from your hotel.</p>
                </div>
              </div>

              {hotelCabBookings.filter(b => b.cabBooking?.status === 'requested').length === 0 ? (
                <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-200">
                  <p className="text-gray-500">No pending cab requests at the moment.</p>
                </div>
              ) : (
                <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {hotelCabBookings.filter(b => b.cabBooking?.status === 'requested').map(booking => (
                        <tr key={booking._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-semibold text-gray-800">{booking.userId?.name || 'Customer'}</div>
                            <div className="text-xs text-gray-500">{booking.bookingId}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-800"><span className="text-green-600 font-bold">●</span> {booking.cabBooking?.pickupLocation?.address || 'Pickup'}</div>
                            <div className="text-sm text-gray-800"><span className="text-red-600 font-bold">●</span> {booking.cabBooking?.dropLocation?.address || 'Drop'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(booking.cabBooking?.pickupDateTime).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {booking.cabBooking?.vehicleType}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex flex-col items-start gap-1">
                            <button
                              disabled={booking.cabBooking?.hotelBookingId?.hotelBooking?.status === 'pending_approval'}
                              onClick={() => {
                                setSelectedCabRequest(booking);
                                setAssignFormData({ vendorId: '' });
                                setShowAssignModal(true);
                              }}
                              className={`bg-primary text-white px-3 py-1.5 rounded hover:bg-primary-light transition text-xs font-bold ${booking.cabBooking?.hotelBookingId?.hotelBooking?.status === 'pending_approval' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              Assign Driver
                            </button>
                            {booking.cabBooking?.hotelBookingId?.hotelBooking?.status === 'pending_approval' && (
                              <span className="text-[10px] text-red-500 font-semibold">Approve hotel booking first</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Assigned/Active Rides Section */}
              <div className="mt-12">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Assigned & Active Rides</h3>
                {hotelCabBookings.filter(b => ['assigned', 'on_the_way', 'arrived_at_pickup', 'trip_started'].includes(b.cabBooking?.status)).length === 0 ? (
                  <p className="text-gray-500 text-sm">No active rides.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {hotelCabBookings.filter(b => ['assigned', 'on_the_way', 'arrived_at_pickup', 'trip_started'].includes(b.cabBooking?.status)).map(booking => (
                      <div key={booking._id} className="border border-gray-200 rounded-xl p-4 bg-gray-50 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-gray-500">{booking.bookingId}</span>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-bold capitalize">{booking.cabBooking?.status.replace(/_/g, ' ')}</span>
                        </div>
                        <p className="text-sm font-bold text-gray-800 truncate">{booking.cabBooking?.pickupLocation?.address || 'Pickup'}</p>
                        <p className="text-sm text-gray-600 truncate mb-2">to {booking.cabBooking?.dropLocation?.address || 'Drop'}</p>
                        <div className="mt-auto pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-500">Assigned Driver:</p>
                          <p className="text-sm font-semibold text-gray-800">{booking.cabBooking?.vendorId?.vendorDetails?.driverName || 'Unknown'}</p>
                        </div>
                        
                        <div className="mt-4">
                          {['assigned', 'on_the_way', 'arrived_at_pickup'].includes(booking.cabBooking?.status) && (
                            <div className="flex flex-col gap-2">
                              <input 
                                type="text" 
                                placeholder="Enter 6-digit OTP" 
                                maxLength={6}
                                value={cabOtp}
                                onChange={(e) => setCabOtp(e.target.value)}
                                className="border border-gray-300 rounded-lg p-2 text-sm text-center tracking-widest focus:ring-primary focus:border-primary"
                              />
                              <button 
                                onClick={() => handleVerifyCabOtp(booking._id)}
                                disabled={verifyingCabOtp || cabOtp.length !== 6}
                                className={`w-full py-2 rounded-lg text-sm font-bold text-white transition ${cabOtp.length !== 6 || verifyingCabOtp ? 'bg-gray-300 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark'}`}
                              >
                                {verifyingCabOtp ? 'Verifying...' : 'Verify OTP & Start Trip'}
                              </button>
                            </div>
                          )}
                          {booking.cabBooking?.status === 'trip_started' && (
                            <button 
                              onClick={() => handleCompleteCabTrip(booking._id)}
                              disabled={completingTrip}
                              className="w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-bold transition"
                            >
                              {completingTrip ? 'Processing...' : 'Complete Trip'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cab Details Modal */}
      {showCabDetails && selectedCab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">{isEditingCab ? 'Edit Cab' : 'Cab Details'}</h2>
              <button onClick={() => { setShowCabDetails(false); setIsEditingCab(false); }} className="text-gray-500 hover:text-gray-800">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {isEditingCab ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name</label>
                    <input type="text" className="w-full border border-gray-300 rounded p-2 focus:ring-primary focus:border-primary" value={editCabForm.vendorDetails?.driverName || ''} onChange={e => setEditCabForm({...editCabForm, vendorDetails: {...editCabForm.vendorDetails, driverName: e.target.value}})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                      <input type="text" className="w-full border border-gray-300 rounded p-2 focus:ring-primary focus:border-primary" value={editCabForm.vendorDetails?.mobile || ''} onChange={e => setEditCabForm({...editCabForm, vendorDetails: {...editCabForm.vendorDetails, mobile: e.target.value}})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input type="email" className="w-full border border-gray-300 rounded p-2 focus:ring-primary focus:border-primary" value={editCabForm.vendorDetails?.email || ''} onChange={e => setEditCabForm({...editCabForm, vendorDetails: {...editCabForm.vendorDetails, email: e.target.value}})} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea className="w-full border border-gray-300 rounded p-2 focus:ring-primary focus:border-primary" rows="2" value={editCabForm.vendorDetails?.address || ''} onChange={e => setEditCabForm({...editCabForm, vendorDetails: {...editCabForm.vendorDetails, address: e.target.value}})}></textarea>
                  </div>
                  <hr className="my-4" />
                  <h3 className="font-bold text-gray-800">Vehicle Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                      <select className="w-full border border-gray-300 rounded p-2 focus:ring-primary focus:border-primary" value={editCabForm.vehicleDetails?.vehicleType || 'Sedan'} onChange={e => setEditCabForm({...editCabForm, vehicleDetails: {...editCabForm.vehicleDetails, vehicleType: e.target.value}})}>
                        <option value="Mini">Mini</option>
                        <option value="Sedan">Sedan</option>
                        <option value="SUV">SUV</option>
                        <option value="Luxury">Luxury</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                      <input type="text" className="w-full border border-gray-300 rounded p-2 focus:ring-primary focus:border-primary" value={editCabForm.vehicleDetails?.model || ''} onChange={e => setEditCabForm({...editCabForm, vehicleDetails: {...editCabForm.vehicleDetails, model: e.target.value}})} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                    <input type="text" className="w-full border border-gray-300 rounded p-2 focus:ring-primary focus:border-primary" value={editCabForm.vehicleDetails?.registrationNumber || ''} onChange={e => setEditCabForm({...editCabForm, vehicleDetails: {...editCabForm.vehicleDetails, registrationNumber: e.target.value}})} />
                  </div>
                  <hr className="my-4" />
                  <h3 className="font-bold text-gray-800">Fare Pricing</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Base Fare (₹)</label>
                      <input type="number" className="w-full border border-gray-300 rounded p-2 focus:ring-primary focus:border-primary" value={editCabForm.fareSetup?.baseFare || 0} onChange={e => setEditCabForm({...editCabForm, fareSetup: {...editCabForm.fareSetup, baseFare: e.target.value}})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Per Km Rate (₹)</label>
                      <input type="number" className="w-full border border-gray-300 rounded p-2 focus:ring-primary focus:border-primary" value={editCabForm.fareSetup?.perKmRate || 0} onChange={e => setEditCabForm({...editCabForm, fareSetup: {...editCabForm.fareSetup, perKmRate: e.target.value}})} />
                    </div>
                  </div>
                </div>
              ) : (
              <>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div><span className="font-semibold text-gray-500">Driver Name:</span> <br/>{selectedCab.vendorDetails?.driverName}</div>
                  <div><span className="font-semibold text-gray-500">Mobile:</span> <br/>{selectedCab.vendorDetails?.mobile}</div>
                  <div><span className="font-semibold text-gray-500">Email:</span> <br/>{selectedCab.vendorDetails?.email || 'N/A'}</div>
                  <div><span className="font-semibold text-gray-500">Address:</span> <br/>{selectedCab.vendorDetails?.address}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  {selectedCab.vendorDetails?.driverPhoto && (
                     <div>
                       <p className="font-semibold text-gray-500 text-sm mb-2">Driver Photo:</p>
                       <img src={selectedCab.vendorDetails.driverPhoto} alt="Driver" className="w-full h-32 object-cover rounded border" />
                     </div>
                  )}
                  {selectedCab.documents?.drivingLicense && (
                     <div>
                       <p className="font-semibold text-gray-500 text-sm mb-2">Driving License:</p>
                       <img src={selectedCab.documents.drivingLicense} alt="License" className="w-full h-32 object-cover rounded border" />
                     </div>
                  )}
                </div>
                
                {selectedCab.driverCredentials && selectedCab.driverCredentials.loginId && (
                  <div className="bg-green-50 border border-green-200 p-4 rounded-xl mt-4">
                    <h3 className="text-green-800 font-bold mb-2">Driver Login Credentials Generated</h3>
                    <p className="text-sm text-green-700 mb-1"><span className="font-semibold">Login ID (Mobile):</span> {selectedCab.driverCredentials.loginId}</p>
                    <p className="text-sm text-green-700 mb-1"><span className="font-semibold">Password:</span> {selectedCab.driverCredentials.password}</p>
                    <p className="text-xs text-green-600 mt-2">Please share these credentials with the driver so they can log in.</p>
                  </div>
                )}
              </>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-4">
              {isEditingCab ? (
                <>
                  <button type="button" onClick={() => setIsEditingCab(false)} className="bg-gray-200 text-gray-800 px-6 py-2 rounded font-bold hover:bg-gray-300 transition">
                    Cancel
                  </button>
                  <button type="button" onClick={handleUpdateCab} disabled={editCabUploading} className={`bg-primary text-white px-8 py-2 rounded font-bold hover:bg-primary-light transition shadow-md ${editCabUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {editCabUploading ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => handleDeleteCab(selectedCab._id)} className="bg-red-100 text-red-700 px-6 py-2 rounded font-bold hover:bg-red-200 transition">
                    Delete Cab
                  </button>
                  <button type="button" onClick={() => { 
                    const vehicle = vehicles.find(v => v.vendorId === selectedCab._id);
                    const fareRule = vehicle ? fareRules.find(f => f.vehicleType === vehicle.details?.vehicleType) : null;
                    setEditCabForm({ 
                      vendorDetails: { ...selectedCab.vendorDetails },
                      vehicleDetails: vehicle ? { ...vehicle.details } : {},
                      fareSetup: fareRule ? { baseFare: fareRule.baseFare, perKmRate: fareRule.perKmRate } : { baseFare: 0, perKmRate: 0 }
                    }); 
                    setIsEditingCab(true); 
                  }} className="bg-yellow-100 text-yellow-700 px-6 py-2 rounded font-bold hover:bg-yellow-200 transition">
                    Edit Cab
                  </button>
                  <button type="button" onClick={() => { setShowCabDetails(false); setIsEditingCab(false); }} className="bg-gray-200 text-gray-800 px-8 py-2 rounded font-bold hover:bg-gray-300 transition shadow-md">
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assign Driver Modal */}
      {showAssignModal && selectedCabRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">Assign Driver</h2>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-500 hover:text-gray-800">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <form onSubmit={handleAssignDriver} className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Customer</p>
                <p className="font-semibold">{selectedCabRequest.userId?.name}</p>
              </div>
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-1">Requested Vehicle Type</p>
                <p className="font-semibold">{selectedCabRequest.cabBooking?.vehicleType}</p>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Driver</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-primary focus:border-primary"
                  value={assignFormData.vendorId}
                  onChange={(e) => setAssignFormData({ vendorId: e.target.value })}
                  required
                >
                  <option value="">-- Choose an available driver --</option>
                  {hotelCabs
                    .filter(cab => cab.status === 'approved' && cab.availability?.isAvailable !== false)
                    .map(cab => {
                      const veh = vehicles.find(v => v.vendorId === cab._id);
                      return (
                        <option key={cab._id} value={cab._id}>
                          {cab.vendorDetails?.driverName} {veh ? `(${veh.details?.vehicleType} - ${veh.details?.registrationNumber})` : ''}
                        </option>
                      );
                  })}
                </select>
                {hotelCabs.filter(c => c.status === 'approved' && c.availability?.isAvailable !== false).length === 0 && (
                  <p className="text-red-500 text-xs mt-2">No available approved drivers found for your hotel. Add more cabs or wait for drivers to finish trips.</p>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setShowAssignModal(false)} className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-bold hover:bg-gray-300 transition">
                  Cancel
                </button>
                <button type="submit" disabled={assigningLoading || !assignFormData.vendorId} className={`bg-primary text-white px-8 py-2 rounded-lg font-bold hover:bg-primary-light transition shadow-md ${(assigningLoading || !assignFormData.vendorId) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {assigningLoading ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProviderDashboard;
