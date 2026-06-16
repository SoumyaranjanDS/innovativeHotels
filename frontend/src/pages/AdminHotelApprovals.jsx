import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { Building2, X } from 'lucide-react';

const AdminHotelApprovals = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      setHotels(res.data.data.unapprovedHotels || []);
    } catch (err) {
      toast.error('Failed to fetch approvals');
    } finally {
      setLoading(false);
    }
  };

  const openDetails = async (id) => {
    try {
      const res = await api.get(`/admin/details/Hotel/${id}`);
      setSelectedProvider({ ...res.data.data, providerType: 'Hotel' });
      setShowModal(true);
      setShowRejectInput(false);
      setRejectReason('');
    } catch (err) {
      toast.error('Failed to fetch hotel details');
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.post('/admin/approve', { id, type: 'Hotel' });
      toast.success('Hotel Approved!');
      setShowModal(false);
      fetchHotels();
    } catch (err) {
      toast.error('Failed to approve Hotel');
    }
  };

  const handleReject = async (id) => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection.');
      return;
    }
    try {
      await api.post('/admin/reject', { id, type: 'Hotel', reason: rejectReason });
      toast.success('Hotel Rejected.');
      setShowModal(false);
      fetchHotels();
    } catch (err) {
      toast.error('Failed to reject Hotel');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Hotel Approvals</h2>
          <p className="text-gray-500">Review and approve new hotel onboarding requests</p>
        </div>
        <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg font-bold flex items-center gap-2">
          <Building2 size={18} />
          Pending: {hotels.length}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {hotels.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No pending hotel approvals at this time.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                <tr>
                  <th className="py-4 px-6">Hotel Name</th>
                  <th className="py-4 px-6">Provider</th>
                  <th className="py-4 px-6">Date Applied</th>
                  <th className="py-4 px-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {hotels.map(h => (
                  <tr key={h._id} className="hover:bg-gray-50 transition">
                    <td className="py-4 px-6 font-semibold text-gray-900">{h.profile?.hotelName || h.hotelName || 'Unnamed Hotel'}</td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">{h.providerId?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{h.providerId?.email}</div>
                    </td>
                    <td className="py-4 px-6 text-gray-500">{new Date(h.createdAt).toLocaleDateString()}</td>
                    <td className="py-4 px-6">
                      <button onClick={() => openDetails(h._id)} className="text-xs bg-primary text-white px-3 py-1.5 rounded hover:bg-primary-dark transition font-medium">
                        Review Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Provider Details Modal */}
      {showModal && selectedProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">Hotel Details</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div><span className="font-semibold text-gray-500">Provider Name:</span><p className="mt-1 font-medium">{selectedProvider.providerId?.name}</p></div>
                <div><span className="font-semibold text-gray-500">Email:</span><p className="mt-1 font-medium">{selectedProvider.providerId?.email}</p></div>
                <div><span className="font-semibold text-gray-500">Hotel Name:</span><p className="mt-1 font-medium">{selectedProvider.profile?.hotelName || selectedProvider.hotelName}</p></div>
                <div><span className="font-semibold text-gray-500">Owner Name:</span><p className="mt-1 font-medium">{selectedProvider.profile?.ownerName}</p></div>
                <div><span className="font-semibold text-gray-500">Mobile:</span><p className="mt-1 font-medium">{selectedProvider.profile?.mobile}</p></div>
                <div><span className="font-semibold text-gray-500">Category:</span><p className="mt-1 font-medium">{selectedProvider.profile?.category}</p></div>
                <div><span className="font-semibold text-gray-500">Star Rating:</span><p className="mt-1 font-medium">{selectedProvider.profile?.starRating} Stars</p></div>
              </div>
              
              <div>
                <span className="font-semibold text-gray-500 block mb-2 text-sm">Address:</span>
                <p className="text-sm bg-gray-50 p-3 rounded border border-gray-100">{selectedProvider.location?.address || 'Not Provided'}</p>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50">
              {!showRejectInput ? (
                <div className="flex justify-end gap-3">
                  <button onClick={() => setShowRejectInput(true)} className="px-5 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-medium transition">Reject</button>
                  <button onClick={() => handleApprove(selectedProvider._id)} className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition">Approve Provider</button>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-red-700">Rejection Reason *</label>
                  <textarea 
                    value={rejectReason} 
                    onChange={e => setRejectReason(e.target.value)} 
                    className="w-full p-3 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm" 
                    placeholder="Explain why this provider is being rejected..." 
                    rows="3"
                  ></textarea>
                  <div className="flex justify-end gap-3 mt-3">
                    <button onClick={() => setShowRejectInput(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg font-medium transition">Cancel</button>
                    <button onClick={() => handleReject(selectedProvider._id)} className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition">Confirm Rejection</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHotelApprovals;
