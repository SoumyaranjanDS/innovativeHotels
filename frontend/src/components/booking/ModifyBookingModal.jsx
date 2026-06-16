import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit, X, Calendar, Users } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'react-toastify';

const ModifyBookingModal = ({ isOpen, onClose, booking, onModifySuccess }) => {
  const [formData, setFormData] = useState({
    newCheckInDate: booking?.hotelBooking?.checkInDate?.split('T')[0] || '',
    newCheckOutDate: booking?.hotelBooking?.checkOutDate?.split('T')[0] || '',
    newGuestCount: booking?.hotelBooking?.guests?.adults || 1,
    newRoomsCount: booking?.hotelBooking?.roomsCount || 1,
    specialRequest: '',
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen || !booking) return null;

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (new Date(formData.newCheckOutDate) <= new Date(formData.newCheckInDate)) {
      toast.error('Check-out date must be after check-in date');
      return;
    }

    setLoading(true);
    try {
      const res = await api.patch(`/hotel-bookings/${booking._id}/modify`, formData);
      toast.success(res.data.message || 'Modification request submitted successfully');
      onModifySuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit modification request');
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
        >
          <div className="flex justify-between items-center p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Edit className="text-primary" /> Modify Booking
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <p className="text-sm text-gray-600 mb-6 bg-blue-50 p-3 rounded-lg border border-blue-100">
              Modifications are subject to hotel availability and approval. Any price differences will be communicated by the admin.
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check-in Date</label>
                  <input
                    type="date"
                    name="newCheckInDate"
                    min={today}
                    value={formData.newCheckInDate}
                    onChange={handleChange}
                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-primary focus:border-primary outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check-out Date</label>
                  <input
                    type="date"
                    name="newCheckOutDate"
                    min={formData.newCheckInDate || today}
                    value={formData.newCheckOutDate}
                    onChange={handleChange}
                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-primary focus:border-primary outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Guests</label>
                  <select
                    name="newGuestCount"
                    value={formData.newGuestCount}
                    onChange={handleChange}
                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-primary focus:border-primary outline-none text-sm"
                  >
                    {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rooms</label>
                  <select
                    name="newRoomsCount"
                    value={formData.newRoomsCount}
                    onChange={handleChange}
                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-primary focus:border-primary outline-none text-sm"
                  >
                    {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Special Requirements</label>
                <textarea
                  name="specialRequest"
                  value={formData.specialRequest}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-primary focus:border-primary outline-none resize-none text-sm"
                  rows="3"
                  placeholder="Explain your modification request..."
                ></textarea>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-lg font-semibold text-gray-600 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary-light transition disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ModifyBookingModal;
