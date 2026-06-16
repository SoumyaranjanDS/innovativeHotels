import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { Building2 } from 'lucide-react';

const ProviderHotelRooms = () => {
  const { activeService } = useOutletContext();
  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Room Form State
  const [roomForm, setRoomForm] = useState({ roomType: '', occupancy: 2, price: 0, totalRooms: 1 });
  const [roomFiles, setRoomFiles] = useState([]);
  
  // Room Details/Delete Modal
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showRoomDetails, setShowRoomDetails] = useState(false);
  const [isEditingRoom, setIsEditingRoom] = useState(false);
  const [editRoomForm, setEditRoomForm] = useState(null);
  const [editRoomUploading, setEditRoomUploading] = useState(false);

  const fetchRooms = async () => {
    try {
      const hotelRes = await api.get('/providers/hotel');
      setHotel(hotelRes.data.hotel);
      if (hotelRes.data.hotel && hotelRes.data.hotel.isApproved) {
        const roomsRes = await api.get('/providers/rooms');
        setRooms(roomsRes.data.rooms);
      }
    } catch (e) {
      console.error("Error fetching rooms", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeService === 'hotel') {
      fetchRooms();
    } else {
      setLoading(false);
    }
  }, [activeService]);

  const handleAddRoom = async (e) => {
    e.preventDefault();
    
    // Filter out null/undefined slots before validating length
    const validFiles = roomFiles.filter(file => file !== null && file !== undefined);
    
    if (validFiles.length < 3 || validFiles.length > 7) {
      toast.error('Please add between 3 and 7 valid photos for the room.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      validFiles.forEach(file => {
        formData.append('files', file);
      });

      const uploadRes = await api.post('/upload/multiple', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const photoUrls = uploadRes.data.urls;

      await api.post('/providers/rooms', { ...roomForm, photos: photoUrls });
      setRoomForm({ roomType: '', occupancy: 2, price: 0, totalRooms: 1 });
      setRoomFiles([]);
      toast.success('Room added successfully');
      fetchRooms();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add room');
    } finally {
      setUploading(false);
    }
  };

  const handleRoomFileChange = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      const newFiles = [...roomFiles];
      newFiles[index] = file;
      setRoomFiles(newFiles);
    }
  };

  const addRoomFileInput = () => {
    if (roomFiles.length < 7) {
      setRoomFiles([...roomFiles, null]);
    }
  };

  const removeRoomFileInput = (index) => {
    const newFiles = [...roomFiles];
    newFiles.splice(index, 1);
    setRoomFiles(newFiles);
  };

  const handleDeleteRoom = async (roomId) => {
    if (window.confirm("Are you sure you want to delete this room?")) {
      try {
        await api.delete(`/providers/rooms/${roomId}`);
        toast.success("Room deleted successfully");
        fetchRooms();
        setShowRoomDetails(false);
      } catch (error) {
        toast.error("Failed to delete room");
      }
    }
  };

  const handleUpdateRoom = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setEditRoomUploading(true);
    try {
      await api.put(`/providers/rooms/${selectedRoom._id}`, {
        roomType: editRoomForm.roomType,
        occupancy: editRoomForm.occupancy,
        price: editRoomForm.price,
        totalRooms: editRoomForm.totalRooms
      });
      toast.success("Room updated successfully");
      fetchRooms();
      setSelectedRoom(prev => ({ ...prev, ...editRoomForm }));
      setIsEditingRoom(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update room');
    } finally {
      setEditRoomUploading(false);
    }
  };

  if (activeService !== 'hotel') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Switch to Hotel Service</h2>
        <p className="text-gray-500">You must be in Hotel mode to manage rooms.</p>
      </div>
    );
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Loading rooms...</div>;

  if (!hotel) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">No Hotel Profile Found</h2>
        <p className="text-gray-500">Please complete your hotel onboarding first.</p>
        <Link to="/provider/onboarding/hotel" className="mt-4 inline-block bg-primary text-white px-6 py-2 rounded-md font-bold">Onboarding</Link>
      </div>
    );
  }

  if (!hotel.isApproved) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Hotel Pending Approval</h2>
        <p className="text-gray-500">You can manage your rooms once your hotel profile is approved by the admin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Building2 className="text-primary" /> Manage Rooms for {hotel.profile?.hotelName}
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
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
            <div className="md:col-span-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Room Photos (Min: 3, Max: 7)</label>
              <div className="space-y-2">
                {roomFiles.length === 0 && (
                   <button type="button" onClick={addRoomFileInput} className="text-sm bg-gray-200 text-gray-800 px-3 py-1.5 rounded hover:bg-gray-300 transition">
                     + Add First Photo
                   </button>
                )}
                {roomFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input type="file" accept="image/*" onChange={e => handleRoomFileChange(e, index)} className="flex-1 p-1.5 border border-gray-300 rounded focus:ring-accent focus:border-accent text-sm" />
                    <button type="button" onClick={() => removeRoomFileInput(index)} className="text-red-500 font-bold px-2 py-1 hover:bg-red-50 rounded">X</button>
                  </div>
                ))}
                {roomFiles.length > 0 && roomFiles.length < 7 && (
                  <button type="button" onClick={addRoomFileInput} className="text-sm bg-gray-200 text-gray-800 px-3 py-1.5 rounded hover:bg-gray-300 transition mt-2 block">
                    + Add Another Photo ({roomFiles.length}/7)
                  </button>
                )}
              </div>
            </div>
            <div className="md:col-span-5 flex justify-end mt-2">
              <button type="submit" disabled={uploading} className={`bg-primary text-white px-6 py-2 rounded font-bold hover:bg-primary-light transition ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {uploading ? 'Uploading...' : 'Add Room'}
              </button>
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
              <div key={room._id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-lg text-gray-800">{room.roomType}</h4>
                  <span className="text-primary font-bold">₹{room.price}</span>
                </div>
                <div className="text-sm text-gray-500 space-y-1 mb-4 flex-1">
                  <p>Max Occupancy: {room.occupancy} Guests</p>
                  <p>Total Inventory: {room.totalRooms} Rooms</p>
                </div>
                <div className="flex justify-between pt-4 border-t border-gray-100">
                  <button onClick={() => { setSelectedRoom(room); setShowRoomDetails(true); }} className="text-sm text-gray-600 font-semibold hover:text-gray-900">View Details</button>
                  <button onClick={() => handleDeleteRoom(room._id)} className="text-sm text-red-600 font-semibold hover:text-red-800">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Room Details Modal */}
      {showRoomDetails && selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">
                {isEditingRoom ? `Edit Room: ${selectedRoom.roomType}` : `Room Details: ${selectedRoom.roomType}`}
              </h2>
              <button onClick={() => { setShowRoomDetails(false); setIsEditingRoom(false); }} className="text-gray-500 hover:text-gray-800">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {isEditingRoom ? (
                <div id="editRoomForm" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                      <input type="text" required value={editRoomForm.roomType} onChange={e => setEditRoomForm({...editRoomForm, roomType: e.target.value})} className="w-full p-2 border border-gray-300 rounded focus:ring-accent focus:border-accent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price per night (₹)</label>
                      <input type="number" min="0" required value={editRoomForm.price} onChange={e => setEditRoomForm({...editRoomForm, price: Number(e.target.value)})} className="w-full p-2 border border-gray-300 rounded focus:ring-accent focus:border-accent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Occupancy</label>
                      <input type="number" min="1" required value={editRoomForm.occupancy} onChange={e => setEditRoomForm({...editRoomForm, occupancy: Number(e.target.value)})} className="w-full p-2 border border-gray-300 rounded focus:ring-accent focus:border-accent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Rooms</label>
                      <input type="number" min="1" required value={editRoomForm.totalRooms} onChange={e => setEditRoomForm({...editRoomForm, totalRooms: Number(e.target.value)})} className="w-full p-2 border border-gray-300 rounded focus:ring-accent focus:border-accent" />
                    </div>
                  </div>
                  {/* Photo editing is not supported in edit mode for simplicity, user can delete and recreate room if photos need to change entirely */}
                  <p className="text-xs text-gray-500 italic mt-4">Note: To change room photos, please delete this room and create a new one.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="font-semibold text-gray-500">Price per night:</span> <br/>₹{selectedRoom.price}</div>
                    <div><span className="font-semibold text-gray-500">Max Occupancy:</span> <br/>{selectedRoom.occupancy} Guests</div>
                    <div><span className="font-semibold text-gray-500">Total Rooms:</span> <br/>{selectedRoom.totalRooms}</div>
                    <div><span className="font-semibold text-gray-500">Amenities:</span> <br/>{selectedRoom.amenities?.length ? selectedRoom.amenities.join(', ') : 'None listed'}</div>
                  </div>
                  
                  <div>
                    <p className="font-semibold text-gray-500 text-sm mb-2">Room Photos ({selectedRoom.photos?.length || 0}):</p>
                    {selectedRoom.photos?.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {selectedRoom.photos.map((photo, i) => (
                          <img key={i} src={photo} alt={`Room ${i+1}`} className="w-full h-24 object-cover rounded border" />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">No photos uploaded for this room.</p>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-4">
              {isEditingRoom ? (
                <>
                  <button type="button" onClick={() => setIsEditingRoom(false)} className="bg-gray-200 text-gray-800 px-6 py-2 rounded font-bold hover:bg-gray-300 transition">
                    Cancel
                  </button>
                  <button type="button" onClick={handleUpdateRoom} disabled={editRoomUploading} className={`bg-primary text-white px-8 py-2 rounded font-bold hover:bg-primary-light transition shadow-md ${editRoomUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {editRoomUploading ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => handleDeleteRoom(selectedRoom._id)} className="bg-red-100 text-red-700 px-6 py-2 rounded font-bold hover:bg-red-200 transition">
                    Delete Room
                  </button>
                  <button type="button" onClick={() => { setEditRoomForm({ ...selectedRoom }); setIsEditingRoom(true); }} className="bg-yellow-100 text-yellow-700 px-6 py-2 rounded font-bold hover:bg-yellow-200 transition">
                    Edit Room
                  </button>
                  <button type="button" onClick={() => setShowRoomDetails(false)} className="bg-gray-200 text-gray-800 px-8 py-2 rounded font-bold hover:bg-gray-300 transition shadow-md">
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProviderHotelRooms;
