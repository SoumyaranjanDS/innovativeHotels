import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const [data, setData] = useState({ unapprovedHotels: [], unapprovedCabs: [], pendingFees: [] });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      setData(res.data.data);
    } catch (err) {
      toast.error('Failed to fetch admin stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleApprove = async (id, type) => {
    try {
      await api.post('/admin/approve', { id, type });
      toast.success(`${type} Approved!`);
      fetchStats();
    } catch (err) {
      toast.error(`Failed to approve ${type}`);
    }
  };

  const handleCollectFee = async (feeId) => {
    try {
      await api.put(`/admin/fees/${feeId}/collect`);
      toast.success('Fee marked as collected!');
      fetchStats();
    } catch (err) {
      toast.error('Failed to collect fee');
    }
  };

  if (loading) return <div className="p-8">Loading Dashboard...</div>;

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* Provider Approvals */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b flex justify-between items-center bg-gray-50">
            <h2 className="text-lg font-bold text-gray-800">Pending Provider Approvals</h2>
            <span className="bg-red-100 text-red-800 font-bold px-3 py-1 rounded-full text-sm">
              {data.unapprovedHotels.length + data.unapprovedCabs.length}
            </span>
          </div>
          <div className="p-0 max-h-96 overflow-y-auto">
            {data.unapprovedHotels.length === 0 && data.unapprovedCabs.length === 0 ? (
               <div className="p-8 text-center text-gray-500">No pending approvals.</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {data.unapprovedHotels.map(h => (
                  <li key={h._id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition">
                    <div>
                      <p className="font-semibold text-gray-800">{h.hotelName}</p>
                      <p className="text-xs font-bold text-blue-600 bg-blue-100 inline-block px-2 py-0.5 rounded mt-1">HOTEL</p>
                    </div>
                    <button onClick={() => handleApprove(h._id, 'Hotel')} className="text-sm bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700 transition">Approve</button>
                  </li>
                ))}
                {data.unapprovedCabs.map(c => (
                  <li key={c._id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition">
                    <div>
                      <p className="font-semibold text-gray-800">{c.driverName || 'Cab Driver'}</p>
                      <p className="text-xs font-bold text-yellow-600 bg-yellow-100 inline-block px-2 py-0.5 rounded mt-1">CAB</p>
                    </div>
                    <button onClick={() => handleApprove(c._id, 'Cab')} className="text-sm bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700 transition">Approve</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Platform Fees Collection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b flex justify-between items-center bg-gray-50">
            <h2 className="text-lg font-bold text-gray-800">Pending COD Commissions</h2>
            <span className="bg-yellow-100 text-yellow-800 font-bold px-3 py-1 rounded-full text-sm">
              {data.pendingFees.length} Pending
            </span>
          </div>
          <div className="p-0 max-h-96 overflow-y-auto">
            {data.pendingFees.length === 0 ? (
               <div className="p-8 text-center text-gray-500">All commissions collected!</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {data.pendingFees.map(f => (
                  <li key={f._id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition">
                    <div>
                      <p className="font-semibold text-gray-800">Provider: {f.providerId?.name}</p>
                      <p className="text-sm text-gray-500">Collected COD: ₹{f.totalFareAmount} | Platform Fee: <strong className="text-primary">₹{f.platformFeeAmount}</strong></p>
                    </div>
                    <button onClick={() => handleCollectFee(f._id)} className="text-sm bg-primary text-white px-4 py-2 rounded font-bold hover:bg-primary-light transition">Collect</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
