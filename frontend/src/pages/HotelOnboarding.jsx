import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axios';

const HotelOnboarding = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    contactNumber: '',
    email: '',
    description: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/providers/hotel-service', formData);
      toast.success('Hotel profile created successfully! Pending admin approval.');
      navigate('/provider/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create hotel profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Hotel Onboarding</h1>
        <p className="text-gray-500 mb-8">Register your hotel property to start receiving bookings.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Name *</label>
              <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary outline-none" placeholder="Grand Plaza Hotel" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email *</label>
              <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary outline-none" placeholder="reservations@grandplaza.com" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
              <input type="tel" name="contactNumber" required value={formData.contactNumber} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary outline-none" placeholder="+1 234 567 8900" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea name="description" rows="4" value={formData.description} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary outline-none" placeholder="Tell us about your property..."></textarea>
            </div>

            <div className="md:col-span-2 border-t pt-6 mt-2">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Location Details</h3>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
              <input type="text" name="address.street" required value={formData.address.street} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary outline-none" placeholder="123 Main St" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
              <input type="text" name="address.city" required value={formData.address.city} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary outline-none" placeholder="New York" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State/Province *</label>
              <input type="text" name="address.state" required value={formData.address.state} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary outline-none" placeholder="NY" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zip/Postal Code *</label>
              <input type="text" name="address.zipCode" required value={formData.address.zipCode} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary outline-none" placeholder="10001" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
              <input type="text" name="address.country" required value={formData.address.country} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary outline-none" placeholder="United States" />
            </div>
          </div>

          <div className="flex justify-end pt-6">
            <button 
              type="submit" 
              disabled={loading}
              className={`bg-primary text-white px-8 py-3 rounded-md font-semibold transition shadow-md ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary-light'}`}
            >
              {loading ? 'Submitting...' : 'Submit Hotel Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HotelOnboarding;
