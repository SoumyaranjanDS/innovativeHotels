import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const [data, setData] = useState({ unapprovedHotels: [], unapprovedHotelCabs: [], unapprovedIndependentCabs: [], pendingFees: [] });
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

  if (loading) return <div className="p-8">Loading Dashboard...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-500">Welcome back to the Admin Portal. Here is your system snapshot.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="text-gray-500 font-medium mb-4 flex justify-between items-center">
            Pending Hotel Approvals
            <span className="bg-blue-50 text-blue-600 p-2 rounded-lg">🏨</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{data.unapprovedHotels?.length || 0}</div>
          <Link to="/admin/approvals/hotels" className="text-sm text-primary font-medium mt-4 hover:underline">Review requests →</Link>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="text-gray-500 font-medium mb-4 flex justify-between items-center">
            Pending Cab Approvals
            <span className="bg-green-50 text-green-600 p-2 rounded-lg">🚕</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {(data.unapprovedHotelCabs?.length || 0) + (data.unapprovedIndependentCabs?.length || 0)}
          </div>
          <Link to="/admin/approvals/cabs" className="text-sm text-primary font-medium mt-4 hover:underline">Review requests →</Link>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="text-gray-500 font-medium mb-4 flex justify-between items-center">
            Pending Fee Settlements
            <span className="bg-purple-50 text-purple-600 p-2 rounded-lg">💰</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{data.pendingFees?.length || 0}</div>
          <Link to="/admin/settlements" className="text-sm text-primary font-medium mt-4 hover:underline">Manage settlements →</Link>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="text-gray-500 font-medium mb-4 flex justify-between items-center">
            Online Platform Revenue
            <span className="bg-emerald-50 text-emerald-600 p-2 rounded-lg">💳</span>
          </div>
          <div className="text-3xl font-bold text-emerald-600">₹{(data.onlineRevenue || 0).toLocaleString()}</div>
          <div className="text-sm text-gray-400 mt-4">Earned directly via Stripe</div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="text-gray-500 font-medium mb-4 flex justify-between items-center">
            Pending Revenue (Owed)
            <span className="bg-amber-50 text-amber-600 p-2 rounded-lg">⏳</span>
          </div>
          <div className="text-3xl font-bold text-amber-600">₹{(data.pendingRevenue || 0).toLocaleString()}</div>
          <div className="text-sm text-gray-400 mt-4">Pending from Providers (Cash)</div>
        </div>

        <div className="bg-gradient-to-br from-primary to-primary-dark p-6 rounded-2xl shadow-md text-white flex flex-col justify-between">
          <div className="font-medium mb-4 opacity-90">System Status</div>
          <div className="text-xl font-bold">All Systems Operational</div>
          <div className="text-sm opacity-80 mt-4">Last checked just now</div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
