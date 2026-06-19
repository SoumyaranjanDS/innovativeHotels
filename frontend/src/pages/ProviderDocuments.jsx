import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { FileText, Save } from 'lucide-react';
import { toast } from 'react-toastify';

const ProviderDocuments = () => {
  const [formData, setFormData] = useState({
    termsAndConditions: '',
    privacyPolicy: '',
    refundPolicy: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchHotel = async () => {
      try {
        const res = await api.get('/providers/hotel');
        if (res.data.success && res.data.hotel) {
          const policies = res.data.hotel.policies || {};
          setFormData({
            termsAndConditions: policies.termsAndConditions || '',
            privacyPolicy: policies.privacyPolicy || '',
            refundPolicy: policies.refundPolicy || ''
          });
        }
      } catch (err) {
        toast.error('Failed to load documents');
      } finally {
        setLoading(false);
      }
    };
    fetchHotel();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put('/providers/hotel-policies', formData);
      if (res.data.success) {
        toast.success('Documents saved successfully!');
      }
    } catch (err) {
      toast.error('Failed to save documents');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-heading">Legal Documents</h1>
          <p className="text-gray-500 mt-1">Manage your hotel's policies and legal information</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-white px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 hover:bg-primary-light transition shadow-sm disabled:opacity-70"
        >
          {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save size={18} />}
          {saving ? 'Saving...' : 'Save Documents'}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
          <FileText className="text-primary" size={20} />
          <h2 className="text-lg font-bold text-gray-900">Terms and Conditions</h2>
        </div>
        <div className="p-6">
          <textarea
            name="termsAndConditions"
            value={formData.termsAndConditions}
            onChange={handleChange}
            placeholder="Enter your hotel's terms and conditions..."
            className="w-full min-h-[150px] p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition resize-y"
          ></textarea>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
          <FileText className="text-primary" size={20} />
          <h2 className="text-lg font-bold text-gray-900">Privacy Policy</h2>
        </div>
        <div className="p-6">
          <textarea
            name="privacyPolicy"
            value={formData.privacyPolicy}
            onChange={handleChange}
            placeholder="Enter your hotel's privacy policy..."
            className="w-full min-h-[150px] p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition resize-y"
          ></textarea>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
          <FileText className="text-primary" size={20} />
          <h2 className="text-lg font-bold text-gray-900">Refund Policy</h2>
        </div>
        <div className="p-6">
          <textarea
            name="refundPolicy"
            value={formData.refundPolicy}
            onChange={handleChange}
            placeholder="Enter your hotel's refund and cancellation policy..."
            className="w-full min-h-[150px] p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition resize-y"
          ></textarea>
        </div>
      </div>
    </div>
  );
};

export default ProviderDocuments;
