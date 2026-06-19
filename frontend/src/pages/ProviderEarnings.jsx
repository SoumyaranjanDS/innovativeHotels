import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Wallet, IndianRupee, ArrowDownToLine, Landmark, Smartphone, X, CheckCircle, Clock, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const ProviderEarnings = () => {
  const [metrics, setMetrics] = useState({ totalRevenue: 0, activeBookings: 0, pendingRequests: 0 });
  const [payoutMethods, setPayoutMethods] = useState({ upiId: '', bankDetails: { accountName: '', accountNumber: '', ifsc: '' } });
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [modalType, setModalType] = useState(null); // 'bank', 'upi', 'withdraw'
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [metricsRes, payoutRes, withdrawalsRes] = await Promise.all([
        api.get('/providers/metrics'),
        api.get('/providers/payout-methods'),
        api.get('/providers/withdrawals')
      ]);
      
      if (metricsRes.data.success) {
        setMetrics(metricsRes.data.metrics);
      }
      if (payoutRes.data.success && payoutRes.data.payoutMethods) {
        setPayoutMethods(payoutRes.data.payoutMethods);
      }
      if (withdrawalsRes.data.success) {
        setWithdrawals(withdrawalsRes.data.withdrawals);
      }
    } catch (err) {
      toast.error('Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePayoutMethod = async (e) => {
    e.preventDefault();
    try {
      const payload = {};
      if (modalType === 'upi') {
        payload.upiId = formData.upiId;
      } else if (modalType === 'bank') {
        payload.bankDetails = {
          accountName: formData.accountName,
          accountNumber: formData.accountNumber,
          ifsc: formData.ifsc
        };
      }
      
      const res = await api.put('/providers/payout-methods', payload);
      if (res.data.success) {
        toast.success('Payout method updated successfully');
        setPayoutMethods(res.data.payoutMethods);
        setModalType(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update payout method');
    }
  };

  const totalWithdrawnAmount = withdrawals.filter(w => w.status !== 'rejected').reduce((sum, w) => sum + w.amount, 0);
  const availableBalance = (parseFloat(metrics.totalRevenue) || 0) - totalWithdrawnAmount;

  const handleWithdrawRequest = async (e) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);
    
    if (amount < 5000) {
      return toast.error('Minimum withdrawal amount is ₹5000');
    }
    if (amount > availableBalance) {
      return toast.error('Withdrawal amount exceeds available balance');
    }
    if (!formData.type) {
      return toast.error('Please select a withdrawal method (Bank or UPI)');
    }

    if (formData.type === 'UPI' && !payoutMethods.upiId) {
       return toast.error('Please add UPI ID before requesting withdrawal');
    }
    if (formData.type === 'Bank' && (!payoutMethods.bankDetails || !payoutMethods.bankDetails.accountNumber)) {
       return toast.error('Please add Bank Details before requesting withdrawal');
    }

    try {
      const res = await api.post('/providers/withdraw', { amount, type: formData.type });
      if (res.data.success) {
        toast.success('Withdrawal request submitted successfully');
        fetchData();
        setModalType(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to request withdrawal');
    }
  };

  const openModal = (type) => {
    setModalType(type);
    if (type === 'upi') setFormData({ upiId: payoutMethods.upiId || '' });
    else if (type === 'bank') setFormData({ ...payoutMethods.bankDetails });
    else if (type === 'withdraw') setFormData({ amount: availableBalance > 5000 ? availableBalance : '', type: 'Bank' });
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
          onClick={() => openModal('withdraw')}
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
            <p className="text-sm text-gray-500 font-medium">Available Balance</p>
            <p className="text-2xl font-bold text-gray-900 flex items-center">
              <IndianRupee size={20} className="mr-1"/>
              {availableBalance.toFixed(2)}
            </p>
            <p className="text-[10px] text-gray-400 mt-1">Total Lifetime: ₹{parseFloat(metrics.totalRevenue || 0).toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
            <Landmark size={24} />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500 font-medium">Bank Account</p>
            <p className="text-gray-900 font-semibold text-sm mt-1">
              {payoutMethods.bankDetails?.accountNumber ? `••••${payoutMethods.bankDetails.accountNumber.slice(-4)}` : 'Not Added'}
            </p>
          </div>
          <button onClick={() => openModal('bank')} className="text-primary text-sm font-semibold hover:underline">
            {payoutMethods.bankDetails?.accountNumber ? 'Edit' : 'Add'}
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center shrink-0">
            <Smartphone size={24} />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500 font-medium">UPI ID</p>
            <p className="text-gray-900 font-semibold text-sm mt-1 truncate max-w-[100px]">
              {payoutMethods.upiId || 'Not Added'}
            </p>
          </div>
          <button onClick={() => openModal('upi')} className="text-primary text-sm font-semibold hover:underline">
            {payoutMethods.upiId ? 'Edit' : 'Add'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-8">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Withdrawal History</h2>
        </div>
        
        {withdrawals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                <tr>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Amount</th>
                  <th className="py-4 px-6">Method</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Admin Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {withdrawals.map(w => (
                  <tr key={w._id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">{new Date(w.createdAt).toLocaleDateString()}</td>
                    <td className="py-4 px-6 font-semibold">₹{w.amount}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {w.type === 'Bank' ? <Landmark size={14} className="text-blue-500"/> : <Smartphone size={14} className="text-purple-500"/>}
                        {w.type}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`flex w-max items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        w.status === 'completed' ? 'bg-green-100 text-green-700' :
                        w.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {w.status === 'completed' && <CheckCircle size={12} />}
                        {w.status === 'rejected' && <XCircle size={12} />}
                        {w.status === 'pending' && <Clock size={12} />}
                        {w.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-500 text-xs">{w.adminNotes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <Wallet size={48} className="text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">No transactions yet</h3>
            <p className="text-gray-500 max-w-md mt-2">Your earnings and payout history will appear here once you start receiving bookings.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {modalType && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">
                {modalType === 'upi' ? 'UPI Details' : modalType === 'bank' ? 'Bank Account Details' : 'Request Withdrawal'}
              </h3>
              <button onClick={() => setModalType(null)} className="text-gray-400 hover:text-gray-800"><X size={20}/></button>
            </div>

            {(modalType === 'upi' || modalType === 'bank') && (
              <form onSubmit={handleSavePayoutMethod} className="space-y-4">
                {modalType === 'upi' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">UPI ID</label>
                    <input type="text" required value={formData.upiId || ''} onChange={e => setFormData({...formData, upiId: e.target.value})} className="w-full border border-gray-200 rounded-lg p-3" placeholder="example@upi"/>
                  </div>
                )}
                {modalType === 'bank' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Account Holder Name</label>
                      <input type="text" required value={formData.accountName || ''} onChange={e => setFormData({...formData, accountName: e.target.value})} className="w-full border border-gray-200 rounded-lg p-3" placeholder="John Doe"/>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Account Number</label>
                      <input type="text" required value={formData.accountNumber || ''} onChange={e => setFormData({...formData, accountNumber: e.target.value})} className="w-full border border-gray-200 rounded-lg p-3" placeholder="1234567890"/>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">IFSC Code</label>
                      <input type="text" required value={formData.ifsc || ''} onChange={e => setFormData({...formData, ifsc: e.target.value})} className="w-full border border-gray-200 rounded-lg p-3" placeholder="SBIN0001234"/>
                    </div>
                  </>
                )}
                <button type="submit" className="w-full bg-primary text-white py-3 rounded-xl font-bold mt-2">Save Details</button>
              </form>
            )}

            {modalType === 'withdraw' && (
              <form onSubmit={handleWithdrawRequest} className="space-y-4">
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 mb-4 text-center">
                  <p className="text-sm text-gray-600 mb-1">Available for Withdrawal</p>
                  <p className="text-3xl font-bold text-primary">₹{availableBalance.toFixed(2)}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Amount (Min ₹5000)</label>
                  <input type="number" min="5000" max={availableBalance} required value={formData.amount || ''} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full border border-gray-200 rounded-lg p-3" placeholder="5000"/>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Withdrawal Method</label>
                  <select required value={formData.type || 'Bank'} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full border border-gray-200 rounded-lg p-3">
                    <option value="Bank">Bank Account {payoutMethods.bankDetails?.accountNumber ? '(Configured)' : '(Not Configured)'}</option>
                    <option value="UPI">UPI {payoutMethods.upiId ? '(Configured)' : '(Not Configured)'}</option>
                  </select>
                </div>
                <button type="submit" disabled={availableBalance < 5000} className="w-full bg-primary text-white py-3 rounded-xl font-bold mt-2 disabled:bg-gray-300 disabled:cursor-not-allowed">
                  Submit Request
                </button>
                {availableBalance < 5000 && (
                  <p className="text-xs text-center text-red-500 mt-2">Available balance is less than minimum withdrawal amount of ₹5000.</p>
                )}
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProviderEarnings;
