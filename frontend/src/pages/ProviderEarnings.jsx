import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Wallet, IndianRupee, ArrowDownToLine, Landmark, Smartphone } from 'lucide-react';
import { toast } from 'react-toastify';

const ProviderEarnings = () => {
  const [metrics, setMetrics] = useState({ totalRevenue: '0.00', activeBookings: 0, pendingRequests: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await api.get('/providers/metrics');
        if (res.data.success) {
          setMetrics(res.data.metrics);
        }
      } catch (err) {
        toast.error('Failed to load earnings');
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  const handleDummyAction = (actionName) => {
    toast.success(`${actionName} feature coming soon!`);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-heading">Earnings Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your revenue and payout methods</p>
        </div>
        <button 
          onClick={() => handleDummyAction('Withdraw')}
          className="bg-primary text-white px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 hover:bg-primary-light transition shadow-sm"
        >
          <ArrowDownToLine size={18} />
          Withdraw Funds
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900 flex items-center">
              <IndianRupee size={20} className="mr-1"/>
              {metrics.totalRevenue}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
            <Landmark size={24} />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500 font-medium">Bank Account</p>
            <p className="text-gray-900 font-semibold text-sm mt-1">Not Added</p>
          </div>
          <button onClick={() => handleDummyAction('Add Bank Account')} className="text-primary text-sm font-semibold hover:underline">Add</button>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center shrink-0">
            <Smartphone size={24} />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500 font-medium">UPI ID</p>
            <p className="text-gray-900 font-semibold text-sm mt-1">Not Added</p>
          </div>
          <button onClick={() => handleDummyAction('Add UPI')} className="text-primary text-sm font-semibold hover:underline">Add</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-8">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Recent Transactions</h2>
        </div>
        <div className="p-12 flex flex-col items-center justify-center text-center">
          <Wallet size={48} className="text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">No transactions yet</h3>
          <p className="text-gray-500 max-w-md mt-2">Your earnings and payout history will appear here once you start receiving bookings.</p>
        </div>
      </div>
    </div>
  );
};

export default ProviderEarnings;
