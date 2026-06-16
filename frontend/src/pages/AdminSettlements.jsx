import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { Settings, Download } from 'lucide-react';

const AdminSettlements = () => {
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettlements();
  }, []);

  const fetchSettlements = async () => {
    try {
      const res = await api.get('/admin/settlements');
      setSettlements(res.data.data);
    } catch (err) {
      toast.error('Failed to fetch settlements');
    } finally {
      setLoading(false);
    }
  };

  const handleCollectFee = async (feeId) => {
    try {
      await api.put(`/admin/fees/${feeId}/collect`);
      toast.success('Fee marked as collected');
      fetchSettlements();
    } catch (err) {
      toast.error('Failed to update fee status');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Settlements & Platform Fees</h2>
          <p className="text-gray-500">Manage platform commissions and provider payouts</p>
        </div>
        <div className="bg-primary/10 text-primary px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
          <Settings size={18} />
          Total Records: {settlements.length}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
              <tr>
                <th className="py-4 px-6">Fee ID / Date</th>
                <th className="py-4 px-6">Provider</th>
                <th className="py-4 px-6">Booking Ref</th>
                <th className="py-4 px-6">Fee Amount</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {settlements.map(fee => (
                <tr key={fee._id} className="hover:bg-gray-50 transition">
                  <td className="py-4 px-6">
                    <div className="font-semibold text-gray-900 text-xs">{fee._id}</div>
                    <div className="text-xs text-gray-500 mt-1">{new Date(fee.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-medium text-gray-900">{fee.providerId?.name || 'Unknown'}</div>
                    <div className="text-xs text-gray-500">{fee.providerId?.email}</div>
                  </td>
                  <td className="py-4 px-6 text-gray-600">
                    {fee.bookingId ? `#${fee.bookingId.bookingId.slice(-6).toUpperCase()}` : 'N/A'}
                  </td>
                  <td className="py-4 px-6 font-bold text-gray-900">
                    ₹{fee.amount}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${fee.status === 'collected' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {fee.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    {fee.status === 'pending' && (
                      <button 
                        onClick={() => handleCollectFee(fee._id)}
                        className="text-xs bg-primary text-white px-3 py-1.5 rounded hover:bg-primary-dark transition font-medium"
                      >
                        Mark Collected
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {settlements.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500">No settlement records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminSettlements;
