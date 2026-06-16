import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { toast } from 'react-toastify';

const CabSuggestionBox = ({ hotelBookingId, hotelAddress }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  // Booking Form State
  const [pickup, setPickup] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [passengers, setPassengers] = useState(2);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await api.get(`/bookings/hotel-bookings/${hotelBookingId}/cab-suggestions`);
        setSuggestions(res.data);
      } catch (error) {
        console.error("Failed to fetch cab suggestions", error);
      } finally {
        setLoading(false);
      }
    };
    if (hotelBookingId) fetchSuggestions();
  }, [hotelBookingId]);

  const handleBookCab = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Check if we want to prefer hotel linked cabs or external
    const cabPreference = suggestions?.hasHotelLinkedCabs ? 'HOTEL_LINKED' : 'EXTERNAL';

    try {
      const payload = {
        pickupLocation: { address: pickup, lat: 0, lng: 0 },
        dropLocation: { address: hotelAddress || 'Hotel Destination', lat: 0, lng: 0 },
        pickupDateTime: `${date}T${time}:00`,
        passengers,
        hotelBookingId,
        cabSourcePreference: cabPreference,
        hotelId: suggestions?.hotelId
      };
      
      const res = await api.post('/bookings/cab/book', payload);
      toast.success("Cab booked successfully! It will be assigned soon.");
      navigate('/my-bookings');
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to book cab");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-4 text-center">Loading cab options...</div>;

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 my-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="bg-primary text-white p-3 rounded-full text-2xl">🚕</div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">Need pickup for your hotel stay?</h3>
          {suggestions?.hasHotelLinkedCabs ? (
            <p className="text-green-600 font-medium">Cabs linked with this hotel are available for your arrival!</p>
          ) : (
            <p className="text-gray-500">No hotel-linked cabs available, but you can book an external cab.</p>
          )}
        </div>
      </div>

      {!showForm ? (
        <div className="flex gap-4 mt-6">
          <button 
            onClick={() => setShowForm(true)} 
            className="bg-primary text-white px-6 py-2 rounded font-bold hover:bg-primary-light transition"
          >
            {suggestions?.hasHotelLinkedCabs ? 'Book Hotel Cab' : 'Book External Cab'}
          </button>
          <button 
            onClick={() => navigate('/my-bookings')} 
            className="border border-gray-300 text-gray-700 px-6 py-2 rounded font-medium hover:bg-gray-50 transition"
          >
            Skip for now
          </button>
        </div>
      ) : (
        <form onSubmit={handleBookCab} className="mt-6 border-t border-gray-100 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location (Airport / Station / Address)</label>
              <input required type="text" value={pickup} onChange={e => setPickup(e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary" placeholder="Enter pickup location..." />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Drop Location</label>
              <input type="text" value={hotelAddress || "Hotel Destination"} disabled className="w-full p-2 border border-gray-200 bg-gray-50 rounded text-gray-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date</label>
              <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Time</label>
              <input required type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Passengers</label>
              <input required type="number" min="1" value={passengers} onChange={e => setPassengers(Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary" />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-4">
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition">Cancel</button>
            <button type="submit" disabled={submitting} className="bg-primary text-white px-8 py-2 rounded font-bold hover:bg-primary-light transition disabled:opacity-70">
              {submitting ? 'Confirming...' : 'Confirm Cab Booking (COD)'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CabSuggestionBox;
