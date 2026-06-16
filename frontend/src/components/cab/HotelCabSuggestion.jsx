import React, { useState, useEffect, useRef } from 'react';
import { useLoadScript, Autocomplete } from '@react-google-maps/api';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import { Car, Navigation, MapPin, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const libraries = ['places'];

const HotelCabSuggestion = ({ hotelId, hotelBookingId, hotelAddress }) => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState({
      address: hotelAddress || 'Booked Hotel',
      // We assume lat/lng is populated if possible, but Google Maps API on backend will need exact coordinates
      // In a real app we geocode the hotelAddress here. For now we use dummy coordinates if not provided.
      lat: 28.6139,
      lng: 77.2090
  });
  
  const [fareEstimate, setFareEstimate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cabSourcePref, setCabSourcePref] = useState('ANY');

  const pickupRef = useRef();
  const navigate = useNavigate();

  const handlePlaceChanged = () => {
    const place = pickupRef.current.getPlace();
    if (place && place.geometry) {
      setPickup({
        address: place.formatted_address,
        placeId: place.place_id,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      });
    }
  };

  const getEstimate = async () => {
    if (!pickup) return toast.error("Please select a pickup location");
    setLoading(true);
    try {
      const res = await api.post('/cabs/fare-estimate', { 
          pickupLocation: pickup, 
          dropLocation: drop, 
          vehicleType: 'Mini' 
      });
      setFareEstimate(res.data.data);
    } catch (err) {
      toast.error("Failed to calculate fare");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (pref = 'ANY') => {
    setLoading(true);
    try {
      const res = await api.post('/cabs/book', {
        pickupLocation: pickup,
        dropLocation: drop,
        pickupDateTime: new Date(),
        tripType: 'pickup_to_hotel',
        passengers: 1,
        vehicleType: 'Mini',
        hotelBookingId,
        hotelId,
        cabSourcePreference: pref
      });
      toast.success("Cab Requested!");
      navigate(`/cab-tracking/${res.data.booking._id}`);
    } catch (err) {
      toast.error("Booking failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) return <div className="text-center p-4">Loading Cab Options...</div>;

  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 mt-8 space-y-6">
      <div className="flex items-center gap-3 border-b border-indigo-200 pb-4">
        <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
          <Car size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-indigo-900">Need a pickup to the hotel?</h3>
          <p className="text-indigo-700 text-sm">Book a cab now and pay directly to the driver.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-indigo-900 mb-1">Pickup Location</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 text-indigo-400" size={18} />
            <Autocomplete
              onLoad={(autocomplete) => { pickupRef.current = autocomplete; }}
              onPlaceChanged={handlePlaceChanged}
            >
              <input 
                type="text" 
                placeholder="Where are you arriving? (e.g. Airport, Station)"
                className="w-full pl-10 p-3 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
              />
            </Autocomplete>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-indigo-900 mb-1">Drop Location (Auto-filled)</label>
          <div className="relative">
            <Navigation className="absolute left-3 top-3 text-gray-400" size={18} />
            <input 
              type="text" 
              readOnly
              value={drop.address}
              className="w-full pl-10 p-3 border border-gray-200 rounded-xl bg-gray-100 text-gray-600 outline-none"
            />
          </div>
        </div>

        {!fareEstimate ? (
          <button 
            onClick={getEstimate}
            disabled={loading}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-sm"
          >
            {loading ? 'Calculating...' : 'See Cab Fare Estimate'}
          </button>
        ) : (
          <div className="bg-white p-5 rounded-xl border border-indigo-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <div>
                <span className="block text-gray-500 text-sm">Distance</span>
                <span className="font-bold text-gray-900">{fareEstimate.distanceKm} km</span>
              </div>
              <div className="text-right">
                <span className="block text-gray-500 text-sm">Estimated Total</span>
                <span className="text-xl font-black text-indigo-600">₹{fareEstimate.estimatedFare}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <button 
                onClick={() => handleConfirm('HOTEL_LINKED')}
                disabled={loading}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
              >
                 <CheckCircle size={18} /> Book Hotel Cab
              </button>
              <button 
                onClick={() => handleConfirm('EXTERNAL')}
                disabled={loading}
                className="w-full py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition"
              >
                Book External Cab
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HotelCabSuggestion;
