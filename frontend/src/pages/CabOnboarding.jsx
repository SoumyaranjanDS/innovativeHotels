import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axios';

const CabOnboarding = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    agencyName: '',
    contactNumber: '',
    email: '',
    baseCity: ''
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/providers/cab-service', formData);
      toast.success('Cab agency profile created successfully! Pending admin approval.');
      navigate('/provider/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create cab profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Cab Service Onboarding</h1>
        <p className="text-gray-500 mb-8">Register your cab agency to start receiving ride requests.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agency/Business Name *</label>
            <input type="text" name="agencyName" required value={formData.agencyName} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary outline-none" placeholder="City Express Cabs" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email *</label>
              <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary outline-none" placeholder="contact@citycabs.com" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
              <input type="tel" name="contactNumber" required value={formData.contactNumber} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary outline-none" placeholder="+1 234 567 8900" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Base Operating City *</label>
            <input type="text" name="baseCity" required value={formData.baseCity} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary outline-none" placeholder="New York" />
          </div>

          <div className="flex justify-end pt-6">
            <button 
              type="submit" 
              disabled={loading}
              className={`bg-primary text-white px-8 py-3 rounded-md font-semibold transition shadow-md w-full md:w-auto ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary-light'}`}
            >
              {loading ? 'Submitting...' : 'Submit Cab Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CabOnboarding;
