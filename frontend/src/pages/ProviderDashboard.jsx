import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import api from '../api/axios';

const ProviderDashboard = () => {
  const { activeService } = useOutletContext();
  const [status, setStatus] = useState(null);
  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Room Form State
  const [roomForm, setRoomForm] = useState({ roomType: '', occupancy: 2, price: 0, totalRooms: 1 });

  const fetchData = async () => {
    try {
      const statusRes = await api.get('/providers/status');
      setStatus(statusRes.data.data || statusRes.data.profile);

      if (activeService === 'hotel') {
        try {
          const hotelRes = await api.get('/providers/hotel');
          setHotel(hotelRes.data.hotel);
          if (hotelRes.data.hotel && hotelRes.data.hotel.isApproved) {
            const roomsRes = await api.get('/providers/rooms');
            setRooms(roomsRes.data.rooms);
          }
        } catch (e) {
          console.log("No hotel found or error fetching hotel");
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

  const handleAddRoom = async (e) => {
    e.preventDefault();
    try {
      await api.post('/providers/rooms', roomForm);
      setRoomForm({ roomType: '', occupancy: 2, price: 0, totalRooms: 1 });
      fetchData(); // Refresh rooms
    } catch (error) {
      console.error("Failed to add room", error);
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
          <p className="text-3xl font-bold text-gray-900">₹0.00</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium mb-1">Active Bookings</h3>
          <p className="text-3xl font-bold text-gray-900">0</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium mb-1">Pending Requests</h3>
          <p className="text-3xl font-bold text-gray-900">0</p>
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

        {showCabOnboarding && (
          <div className="text-center m-auto">
            <div className="text-6xl mb-4">🚕</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Vehicles Registered</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">You haven't added any cab services yet. Complete the onboarding to start receiving ride requests.</p>
            <Link to="/provider/onboarding/cab" className="bg-primary text-white px-6 py-3 rounded-md font-semibold hover:bg-primary-light transition shadow-md">
              Start Cab Onboarding
            </Link>
          </div>
        )}

        {activeService === 'hotel' && isHotelActive && (
          <div>
            {!hotel ? (
              <div className="p-8 text-center">Loading hotel details...</div>
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
                  <div>
                    <h2 className="text-3xl font-bold text-gray-800">{hotel.profile?.hotelName}</h2>
                    <p className="text-gray-500">Manage your rooms and availability.</p>
                  </div>
                  <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-bold text-sm">Approved</span>
                </div>

                {/* Add Room Form */}
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Add New Room Type</h3>
                  <form onSubmit={handleAddRoom} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                      <input type="text" required value={roomForm.roomType} onChange={e => setRoomForm({...roomForm, roomType: e.target.value})} className="w-full p-2 border border-gray-300 rounded focus:ring-accent focus:border-accent" placeholder="e.g. Deluxe Suite" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Occupancy</label>
                      <input type="number" min="1" required value={roomForm.occupancy} onChange={e => setRoomForm({...roomForm, occupancy: Number(e.target.value)})} className="w-full p-2 border border-gray-300 rounded focus:ring-accent focus:border-accent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                      <input type="number" min="0" required value={roomForm.price} onChange={e => setRoomForm({...roomForm, price: Number(e.target.value)})} className="w-full p-2 border border-gray-300 rounded focus:ring-accent focus:border-accent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Rooms</label>
                      <input type="number" min="1" required value={roomForm.totalRooms} onChange={e => setRoomForm({...roomForm, totalRooms: Number(e.target.value)})} className="w-full p-2 border border-gray-300 rounded focus:ring-accent focus:border-accent" />
                    </div>
                    <div className="md:col-span-4 flex justify-end mt-2">
                      <button type="submit" className="bg-primary text-white px-6 py-2 rounded font-bold hover:bg-primary-light transition">Add Room</button>
                    </div>
                  </form>
                </div>

                {/* Existing Rooms List */}
                <h3 className="text-xl font-bold text-gray-800 mb-4">Your Rooms</h3>
                {rooms.length === 0 ? (
                  <p className="text-gray-500">No rooms added yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rooms.map(room => (
                      <div key={room._id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-lg text-gray-800">{room.roomType}</h4>
                          <span className="text-primary font-bold">₹{room.price}</span>
                        </div>
                        <div className="text-sm text-gray-500 space-y-1">
                          <p>Max Occupancy: {room.occupancy} Guests</p>
                          <p>Total Inventory: {room.totalRooms} Rooms</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeService === 'cab' && isCabActive && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Cab Management Dashboard</h2>
            <p className="text-gray-500">Welcome to your active cab management console.</p>
            {/* Real charts/tables would go here */}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderDashboard;
