import React, { useState, useRef } from 'react';
import { useLoadScript, Autocomplete } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';

const libraries = ['places'];

const CabBooking = () => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);
  const [fareEstimate, setFareEstimate] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickupRef = useRef();
  const dropRef = useRef();
  const navigate = useNavigate();

  const handlePlaceChanged = (ref, setLocation) => {
    const place = ref.current.getPlace();
    if (place && place.geometry) {
      setLocation({
        address: place.formatted_address,
        placeId: place.place_id,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      });
    }
  };

  const getEstimate = async () => {
    if (!pickup || !drop) return toast.error("Please select both pickup and drop locations from the dropdown");
    setLoading(true);
    try {
      const res = await api.post('/cabs/fare-estimate', { pickupLocation: pickup, dropLocation: drop, vehicleType: 'Mini' });
      setFareEstimate(res.data.data);
    } catch (err) {
      toast.error("Failed to calculate fare");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const res = await api.post('/cabs/book', {
        pickupLocation: pickup,
        dropLocation: drop,
        pickupDateTime: new Date(),
        tripType: 'local',
        passengers: 1,
        vehicleType: 'Mini'
      });
      toast.success("Booking Requested!");
      navigate(`/cab-tracking/${res.data.booking._id}`);
    } catch (err) {
      toast.error("Booking failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) return <div className="p-8 text-center">Loading Maps...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">Book a Cab</h1>

        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
              <Autocomplete
                onLoad={(autocomplete) => { pickupRef.current = autocomplete; }}
                onPlaceChanged={() => handlePlaceChanged(pickupRef, setPickup)}
              >
                <input 
                  type="text" 
                  placeholder="Enter pickup location"
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </Autocomplete>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Drop Location</label>
              <Autocomplete
                onLoad={(autocomplete) => { dropRef.current = autocomplete; }}
                onPlaceChanged={() => handlePlaceChanged(dropRef, setDrop)}
              >
                <input 
                  type="text" 
                  placeholder="Enter drop location"
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </Autocomplete>
            </div>
          </div>

          <button 
            onClick={getEstimate}
            disabled={loading}
            className="w-full py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary-light transition"
          >
            {loading ? 'Calculating...' : 'Get Fare Estimate'}
          </button>
        </div>

        {fareEstimate && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-primary/20 space-y-6">
            <h3 className="text-xl font-bold text-gray-900 border-b pb-4">Fare Estimate</h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-4 bg-gray-50 rounded-lg">
                <span className="block text-gray-500 mb-1">Distance</span>
                <span className="font-semibold text-lg">{fareEstimate.distanceKm} km</span>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <span className="block text-gray-500 mb-1">Duration</span>
                <span className="font-semibold text-lg">{fareEstimate.durationMinutes} mins</span>
              </div>
            </div>

            <div className="flex justify-between items-center py-4 border-y border-dashed border-gray-200">
              <span className="font-medium text-gray-700">Estimated Total (COD)</span>
              <span className="text-3xl font-bold text-primary">₹{fareEstimate.estimatedFare}</span>
            </div>

            <button 
              onClick={handleConfirm}
              disabled={loading}
              className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg hover:bg-primary-light transition shadow-md"
            >
              Confirm Cab (Pay on Delivery)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CabBooking;
