import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const SelectService = () => {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSelect = async (service) => {
    setLoading(true);
    try {
      const type = service === 'hotel' ? 'Hotel' : 'Cab';
      await api.patch('/providers/type', { providerType: type });
      updateUser({ providerType: type });
      
      if (service === 'hotel') {
        navigate('/provider/onboarding/hotel');
      } else {
        navigate('/provider/onboarding/cab');
      }
    } catch (err) {
      toast.error('Failed to select service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-primary mb-4">Welcome to InoProvider!</h1>
        <p className="text-xl text-gray-600">What service would you like to provide?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        {/* Hotel Option */}
        <div 
          onClick={() => handleSelect('hotel')}
          className="bg-white p-8 rounded-2xl shadow-lg border-2 border-transparent hover:border-primary hover:shadow-2xl transition cursor-pointer flex flex-col items-center text-center group"
        >
          <div className="text-8xl mb-6 group-hover:scale-110 transition-transform">🏨</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Hotel Service</h2>
          <p className="text-gray-500 mb-6">List your hotel, manage rooms, availability, and receive bookings.</p>
          <button className="mt-auto bg-primary text-white px-6 py-2 rounded-md font-medium w-full group-hover:bg-primary-light transition">
            Select Hotel
          </button>
        </div>

        {/* Cab Option */}
        <div 
          onClick={() => handleSelect('cab')}
          className="bg-white p-8 rounded-2xl shadow-lg border-2 border-transparent hover:border-primary hover:shadow-2xl transition cursor-pointer flex flex-col items-center text-center group"
        >
          <div className="text-8xl mb-6 group-hover:scale-110 transition-transform">🚕</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Cab Service</h2>
          <p className="text-gray-500 mb-6">Register your vehicles, set up fares, and start accepting ride requests.</p>
          <button className="mt-auto bg-primary text-white px-6 py-2 rounded-md font-medium w-full group-hover:bg-primary-light transition">
            Select Cab
          </button>
        </div>
      </div>
      
      <Link to="/provider/dashboard" className="mt-12 text-gray-500 hover:text-primary transition underline">
        Skip for now and go to Dashboard
      </Link>
    </div>
  );
};

export default SelectService;
