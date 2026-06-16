import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axios';

const HotelCabOnboarding = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [driverPhotoFile, setDriverPhotoFile] = useState(null);
  const [licenseFile, setLicenseFile] = useState(null);
  const [idFile, setIdFile] = useState(null);
  const [rcFile, setRcFile] = useState(null);
  const [insuranceFile, setInsuranceFile] = useState(null);

  const [formData, setFormData] = useState({
    driverDetails: {
      driverName: '',
      mobile: '',
      email: '',
      address: '',
      emergencyContact: '',
      driverPhoto: ''
    },
    vehicleDetails: {
      vehicleType: 'Sedan',
      model: '',
      year: new Date().getFullYear(),
      registrationNumber: '',
      seatingCapacity: 4,
      luggageCapacity: 2,
      isAC: true,
      fuelType: 'Petrol',
      color: '',
      photos: []
    },
    fareSetup: {
      tripType: 'local',
      baseFare: 0,
      perKmRate: 0,
      perHourRate: 0,
      waitingCharge: 0,
      nightCharge: 0
    }
  });

  const handleChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
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

      // Helper function to upload single file
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
        driverDetails: {
          ...formData.driverDetails,
          driverPhoto: driverPhotoUrl,
          documents: {
            drivingLicense: licenseUrl,
            driverId: idUrl
          }
        },
        vehicleDetails: {
          ...formData.vehicleDetails,
          documents: {
            rc: rcUrl,
            insurance: insuranceUrl
          }
        }
      };
      
      const res = await api.post('/hotel-cabs/onboard', payload);
      toast.success("Hotel Cab Onboarding Submitted Successfully!");
      navigate('/provider/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit cab onboarding");
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
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mt-8">
        <div className="bg-primary px-6 py-8 text-white text-center">
          <h2 className="text-3xl font-bold">Onboard Hotel-Linked Cab</h2>
          <p className="mt-2 text-primary-light">Add a cab that operates directly from your hotel.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Driver Details */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Driver Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name</label>
                <input required type="text" value={formData.driverDetails.driverName} onChange={e => handleChange('driverDetails', 'driverName', e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                <input required type="tel" value={formData.driverDetails.mobile} onChange={e => handleChange('driverDetails', 'mobile', e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                <input required type="tel" value={formData.driverDetails.emergencyContact} onChange={e => handleChange('driverDetails', 'emergencyContact', e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input required type="text" value={formData.driverDetails.address} onChange={e => handleChange('driverDetails', 'address', e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Driver Photo</label>
                <input required type="file" accept="image/*" onChange={e => setDriverPhotoFile(e.target.files[0])} className="w-full p-1.5 border border-gray-300 rounded focus:ring-primary focus:border-primary text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Driving License Document</label>
                <input required type="file" accept="image/*,.pdf" onChange={e => setLicenseFile(e.target.files[0])} className="w-full p-1.5 border border-gray-300 rounded focus:ring-primary focus:border-primary text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Driver ID Proof (Aadhar/Passport)</label>
                <input required type="file" accept="image/*,.pdf" onChange={e => setIdFile(e.target.files[0])} className="w-full p-1.5 border border-gray-300 rounded focus:ring-primary focus:border-primary text-sm" />
              </div>
            </div>
          </div>

          {/* Vehicle Details */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Vehicle Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                <select value={formData.vehicleDetails.vehicleType} onChange={e => handleChange('vehicleDetails', 'vehicleType', e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary">
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="Hatchback">Hatchback</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                <input required type="text" value={formData.vehicleDetails.registrationNumber} onChange={e => handleChange('vehicleDetails', 'registrationNumber', e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand & Model</label>
                <input required type="text" value={formData.vehicleDetails.model} onChange={e => handleChange('vehicleDetails', 'model', e.target.value)} placeholder="e.g. Maruti Dzire" className="w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year of Manufacture</label>
                <input required type="number" min="2000" max={new Date().getFullYear() + 1} value={formData.vehicleDetails.year} onChange={e => handleChange('vehicleDetails', 'year', Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seating Capacity</label>
                <input required type="number" min="1" value={formData.vehicleDetails.seatingCapacity} onChange={e => handleChange('vehicleDetails', 'seatingCapacity', Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Luggage Capacity</label>
                <input required type="number" min="0" value={formData.vehicleDetails.luggageCapacity} onChange={e => handleChange('vehicleDetails', 'luggageCapacity', Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
                <select value={formData.vehicleDetails.fuelType} onChange={e => handleChange('vehicleDetails', 'fuelType', e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary">
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="CNG">CNG</option>
                  <option value="Electric">Electric</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <input type="text" value={formData.vehicleDetails.color} onChange={e => handleChange('vehicleDetails', 'color', e.target.value)} placeholder="e.g. White" className="w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary" />
              </div>
              <div className="flex items-center mt-6">
                <input type="checkbox" id="isAC" checked={formData.vehicleDetails.isAC} onChange={e => handleChange('vehicleDetails', 'isAC', e.target.checked)} className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary" />
                <label htmlFor="isAC" className="ml-2 block text-sm font-medium text-gray-700">Air Conditioned (AC)</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle RC Document</label>
                <input required type="file" accept="image/*,.pdf" onChange={e => setRcFile(e.target.files[0])} className="w-full p-1.5 border border-gray-300 rounded focus:ring-primary focus:border-primary text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Insurance</label>
                <input required type="file" accept="image/*,.pdf" onChange={e => setInsuranceFile(e.target.files[0])} className="w-full p-1.5 border border-gray-300 rounded focus:ring-primary focus:border-primary text-sm" />
              </div>
            </div>
          </div>

          {/* Fare Setup */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Fare Setup</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Base Fare (₹)</label>
                <input required type="number" min="0" value={formData.fareSetup.baseFare} onChange={e => handleChange('fareSetup', 'baseFare', Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Per Km Rate (₹)</label>
                <input required type="number" min="0" value={formData.fareSetup.perKmRate} onChange={e => handleChange('fareSetup', 'perKmRate', Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Waiting Charge (₹/hr)</label>
                <input type="number" min="0" value={formData.fareSetup.waitingCharge} onChange={e => handleChange('fareSetup', 'waitingCharge', Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary" />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button type="button" onClick={() => navigate('/provider/dashboard')} className="mr-4 px-6 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition">Cancel</button>
            <button type="submit" disabled={loading} className="bg-primary text-white px-8 py-2 rounded font-bold hover:bg-primary-light transition disabled:opacity-70">
              {loading ? 'Submitting...' : 'Submit for Approval'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HotelCabOnboarding;
