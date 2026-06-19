import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Wallet, IndianRupee, ArrowDownToLine, Landmark, Smartphone, X, CheckCircle, Clock, XCircle, Banknote, Receipt } from 'lucide-react';
import { toast } from 'react-toastify';

const ProviderEarnings = () => {
  const [metrics, setMetrics] = useState({ totalOnlineRevenue: 0, totalCodCollected: 0, totalPlatformOwed: 0, activeBookings: 0, pendingRequests: 0 });
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
  const totalOnlineRevenue = parseFloat(metrics.totalOnlineRevenue) || 0;
  const totalCodCollected = parseFloat(metrics.totalCodCollected) || 0;
  const totalPlatformOwed = parseFloat(metrics.totalPlatformOwed) || 0;

  const rawAvailableBalance = totalOnlineRevenue - totalPlatformOwed - totalWithdrawnAmount;
  const availableBalance = rawAvailableBalance > 0 ? rawAvailableBalance : 0;
  const amountOwedToPlatform = rawAvailableBalance < 0 ? Math.abs(rawAvailableBalance) : 0;

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
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-heading">Earnings Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your revenue, cash collections, and payouts</p>
        </div>
        {amountOwedToPlatform > 0 ? (
          <button 
            onClick={() => toast.info('Payment gateway integration required to settle negative balance.')}
            className="bg-red-500 text-white px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 hover:bg-red-600 transition shadow-sm"
          >
            <Wallet size={18} />
            Pay to Platform (₹{amountOwedToPlatform.toFixed(2)})
          </button>
        ) : (
          <button 
            onClick={() => openModal('withdraw')}
            className="bg-primary text-white px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 hover:bg-primary-light transition shadow-sm"
          >
            <ArrowDownToLine size={18} />
            Withdraw Funds
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3">
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
            <Wallet size={20} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Online Earnings</p>
            <p className="text-2xl font-bold text-gray-900 flex items-center mt-1">
              <IndianRupee size={20} className="mr-0.5"/>
              {totalOnlineRevenue.toFixed(2)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Platform holds this</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
            <Banknote size={20} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Cash Collected (COD)</p>
            <p className="text-2xl font-bold text-gray-900 flex items-center mt-1">
              <IndianRupee size={20} className="mr-0.5"/>
              {totalCodCollected.toFixed(2)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Cash you directly collected</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3">
          <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center shrink-0">
            <Receipt size={20} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Platform Owed</p>
            <p className="text-2xl font-bold text-gray-900 flex items-center mt-1">
              <IndianRupee size={20} className="mr-0.5"/>
              {totalPlatformOwed.toFixed(2)}
            </p>
            <p className="text-xs text-red-400/80 mt-1 font-medium">Commission from COD</p>
          </div>
        </div>

        <div className={`p-6 rounded-2xl shadow-sm border flex flex-col gap-3 ${amountOwedToPlatform > 0 ? 'bg-red-50 border-red-200' : 'bg-primary/5 border-primary/20'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${amountOwedToPlatform > 0 ? 'bg-red-100 text-red-600' : 'bg-primary/20 text-primary-dark'}`}>
            <Landmark size={20} />
          </div>
          <div>
            <p className={`text-sm font-medium ${amountOwedToPlatform > 0 ? 'text-red-600' : 'text-primary-dark'}`}>
              {amountOwedToPlatform > 0 ? 'Owed to Platform' : 'Available for Withdrawal'}
            </p>
            <p className={`text-2xl font-bold flex items-center mt-1 ${amountOwedToPlatform > 0 ? 'text-red-700' : 'text-primary-dark'}`}>
              <IndianRupee size={20} className="mr-0.5"/>
              {amountOwedToPlatform > 0 ? amountOwedToPlatform.toFixed(2) : availableBalance.toFixed(2)}
            </p>
            <p className={`text-xs mt-1 ${amountOwedToPlatform > 0 ? 'text-red-500' : 'text-primary/70'}`}>
              {amountOwedToPlatform > 0 ? 'Please settle negative balance' : `Withdrawn: ₹${totalWithdrawnAmount.toFixed(2)}`}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <p className="text-gray-900 font-semibold text-sm mt-1 truncate max-w-[150px]">
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
                  
                  <div className="mt-3 pt-3 border-t border-primary/10 text-xs text-gray-500 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span>Online Earnings:</span> 
                      <span className="font-semibold text-gray-800">₹{totalOnlineRevenue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-red-500">
                      <span>Platform Fee (from COD):</span> 
                      <span className="font-semibold">-₹{totalPlatformOwed.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-red-500">
                      <span>Already Withdrawn:</span> 
                      <span className="font-semibold">-₹{totalWithdrawnAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 italic mb-4 bg-gray-50 p-2 rounded-lg border border-gray-100">
                  Note: We automatically deduct the platform fees for Cash on Delivery (COD) bookings you collected directly from your online earnings balance.
                </p>

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
