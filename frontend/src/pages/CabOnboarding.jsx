import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axios';

const CabOnboarding = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    agencyName: '',
    contactNumber: '',
    email: '',
    baseCity: '',
    vehicleDetails: {
      vehicleType: 'Sedan',
      model: '',
      year: new Date().getFullYear(),
      registrationNumber: '',
      seatingCapacity: 4,
      luggageCapacity: 2,
      isAC: true,
      fuelType: 'Petrol',
      color: ''
    }
  });
  const [driverPhotoFile, setDriverPhotoFile] = useState(null);
  const [licenseFile, setLicenseFile] = useState(null);
  const [idFile, setIdFile] = useState(null);
  const [rcFile, setRcFile] = useState(null);
  const [insuranceFile, setInsuranceFile] = useState(null);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleVehicleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      vehicleDetails: { ...prev.vehicleDetails, [field]: value }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let driverPhotoUrl = '';
      let licenseUrl = '';
      let idUrl = '';
      let rcUrl = '';
      let insuranceUrl = '';

      const uploadSingle = async (file) => {
        const uploadData = new FormData();
        uploadData.append('file', file);
        const res = await api.post('/upload', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data.url;
      };

      if (driverPhotoFile) driverPhotoUrl = await uploadSingle(driverPhotoFile);
      if (licenseFile) licenseUrl = await uploadSingle(licenseFile);
      if (idFile) idUrl = await uploadSingle(idFile);
      if (rcFile) rcUrl = await uploadSingle(rcFile);
      if (insuranceFile) insuranceUrl = await uploadSingle(insuranceFile);

      const payload = { 
        ...formData,
        documents: {
          driverPhoto: driverPhotoUrl,
          drivingLicense: licenseUrl,
          driverId: idUrl
        },
        vehicleDocuments: {
          rc: rcUrl,
          insurance: insuranceUrl
        }
      };

      await api.post('/providers/cab-service', payload);
      toast.success('Cab agency profile created successfully! Pending admin approval.');
      navigate('/provider/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create cab profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 relative">
      <div className="absolute top-4 left-4 md:top-8 md:left-8">
        <Link to="/provider/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-primary transition font-medium bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Dashboard
        </Link>
      </div>
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mt-8">
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

          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Vehicle Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                <select value={formData.vehicleDetails.vehicleType} onChange={e => handleVehicleChange('vehicleType', e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary">
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="Hatchback">Hatchback</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand & Model</label>
                <input required type="text" value={formData.vehicleDetails.model} onChange={e => handleVehicleChange('model', e.target.value)} placeholder="e.g. Hyundai Verna" className="w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                <input required type="text" value={formData.vehicleDetails.registrationNumber} onChange={e => handleVehicleChange('registrationNumber', e.target.value)} placeholder="e.g. SED7854" className="w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year of Manufacture</label>
                <input required type="number" min="2000" max={new Date().getFullYear() + 1} value={formData.vehicleDetails.year} onChange={e => handleVehicleChange('year', Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seating Capacity</label>
                <input required type="number" min="1" value={formData.vehicleDetails.seatingCapacity} onChange={e => handleVehicleChange('seatingCapacity', Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Luggage Capacity</label>
                <input required type="number" min="0" value={formData.vehicleDetails.luggageCapacity} onChange={e => handleVehicleChange('luggageCapacity', Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
                <select value={formData.vehicleDetails.fuelType} onChange={e => handleVehicleChange('fuelType', e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary">
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="CNG">CNG</option>
                  <option value="Electric">Electric</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <input type="text" value={formData.vehicleDetails.color} onChange={e => handleVehicleChange('color', e.target.value)} placeholder="e.g. White" className="w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary" />
              </div>
              <div className="flex items-center mt-6">
                <input type="checkbox" id="isAC" checked={formData.vehicleDetails.isAC} onChange={e => handleVehicleChange('isAC', e.target.checked)} className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary" />
                <label htmlFor="isAC" className="ml-2 block text-sm font-medium text-gray-700">Air Conditioned (AC)</label>
              </div>
            </div>
          </div>

          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Required Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Driver Photo</label>
                <input required type="file" accept="image/*" onChange={e => setDriverPhotoFile(e.target.files[0])} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Driving License</label>
                <input required type="file" accept="image/*,.pdf" onChange={e => setLicenseFile(e.target.files[0])} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Driver ID Proof (Aadhar/Passport)</label>
                <input required type="file" accept="image/*,.pdf" onChange={e => setIdFile(e.target.files[0])} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle RC Document</label>
                <input required type="file" accept="image/*,.pdf" onChange={e => setRcFile(e.target.files[0])} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Insurance</label>
                <input required type="file" accept="image/*,.pdf" onChange={e => setInsuranceFile(e.target.files[0])} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary outline-none text-sm" />
              </div>
            </div>
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
