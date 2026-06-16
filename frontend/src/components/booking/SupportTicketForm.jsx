import React, { useState } from 'react';
import { LifeBuoy, Send } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'react-toastify';

const SupportTicketForm = ({ bookingId, onSuccess }) => {
  const [formData, setFormData] = useState({
    category: 'booking_issue',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  const categories = [
    { value: 'booking_issue', label: 'Booking Issue' },
    { value: 'payment_issue', label: 'Payment / Refund Issue' },
    { value: 'hotel_issue', label: 'Hotel Experience' },
    { value: 'cab_pickup_issue', label: 'Cab Pickup Issue' },
    { value: 'cancellation_issue', label: 'Cancellation / Modification' },
    { value: 'other', label: 'Other' },
  ];

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.message.trim()) {
      toast.error('Please provide a subject and message');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/hotel-bookings/${bookingId}/support`, formData);
      toast.success('Support ticket created successfully. Our team will contact you soon.');
      setFormData({ category: 'booking_issue', subject: '', message: '' });
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create support ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <LifeBuoy className="text-primary" /> Need Help?
      </h3>
      <p className="text-sm text-gray-500 mb-6">If you're facing any issues with this booking, let us know and our support team will assist you.</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Issue Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-primary focus:border-primary outline-none text-sm"
          >
            {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-primary focus:border-primary outline-none text-sm"
            placeholder="Brief summary of the issue"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-primary focus:border-primary outline-none resize-none text-sm"
            rows="4"
            placeholder="Please provide details so we can help you better..."
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-gray-900 text-white rounded-lg font-bold hover:bg-gray-800 transition disabled:opacity-50 flex justify-center items-center gap-2"
        >
          {loading ? 'Submitting...' : <><Send size={16} /> Submit Ticket</>}
        </button>
      </form>
    </div>
  );
};

export default SupportTicketForm;
