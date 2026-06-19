import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { CreditCard, Landmark, Smartphone, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';

const AdminWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      const res = await api.get('/admin/withdrawals');
      if (res.data.success) {
        setWithdrawals(res.data.withdrawals);
      }
    } catch (err) {
      toast.error('Failed to load withdrawals');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!selectedWithdrawal) return;
    try {
      const res = await api.patch(`/admin/withdrawals/${selectedWithdrawal._id}/status`, {
        status,
        adminNotes
      });
      if (res.data.success) {
        toast.success(`Withdrawal marked as ${status}`);
        setWithdrawals(prev => prev.map(w => w._id === selectedWithdrawal._id ? res.data.withdrawal : w));
        setSelectedWithdrawal(null);
        setAdminNotes('');
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-heading">Withdrawal Requests</h1>
          <p className="text-gray-500 mt-1">Manage payout requests from providers</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
              <tr>
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6">Provider</th>
                <th className="py-4 px-6">Amount</th>
                <th className="py-4 px-6">Method</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {withdrawals.map((w) => (
                <tr key={w._id} className="hover:bg-gray-50">
                  <td className="py-4 px-6">{new Date(w.createdAt).toLocaleDateString()}</td>
                  <td className="py-4 px-6">
                    <p className="font-semibold text-gray-900">{w.providerId?.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">{w.providerId?.email}</p>
                  </td>
                  <td className="py-4 px-6 font-bold text-gray-900">₹{w.amount}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1.5 font-medium">
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
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => { setSelectedWithdrawal(w); setAdminNotes(w.adminNotes || ''); }}
                      className="text-primary hover:text-primary-dark font-medium inline-flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-lg"
                    >
                      View <ExternalLink size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {withdrawals.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-500">
                    <CreditCard size={48} className="mx-auto text-gray-300 mb-4" />
                    No withdrawal requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Process Modal */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-3">Process Withdrawal</h3>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 mb-1">Provider Name</p>
                    <p className="font-semibold text-gray-900">{selectedWithdrawal.providerId?.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Provider Email</p>
                    <p className="font-semibold text-gray-900">{selectedWithdrawal.providerId?.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Amount Requested</p>
                    <p className="font-bold text-lg text-primary">₹{selectedWithdrawal.amount}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Date Requested</p>
                    <p className="font-semibold text-gray-900">{new Date(selectedWithdrawal.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
                  {selectedWithdrawal.type === 'Bank' ? <Landmark size={18} className="text-blue-500"/> : <Smartphone size={18} className="text-purple-500"/>}
                  Payout Details ({selectedWithdrawal.type})
                </h4>
                
                <div className="space-y-2 text-sm bg-white p-3 rounded-lg border border-gray-100">
                  {selectedWithdrawal.type === 'Bank' && selectedWithdrawal.details?.bankDetails ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Account Name:</span>
                        <span className="font-mono font-semibold">{selectedWithdrawal.details.bankDetails.accountName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Account Number:</span>
                        <span className="font-mono font-semibold">{selectedWithdrawal.details.bankDetails.accountNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">IFSC Code:</span>
                        <span className="font-mono font-semibold">{selectedWithdrawal.details.bankDetails.ifsc}</span>
                      </div>
                    </>
                  ) : selectedWithdrawal.type === 'UPI' ? (
                    <div className="flex justify-between">
                      <span className="text-gray-500">UPI ID:</span>
                      <span className="font-mono font-semibold">{selectedWithdrawal.details?.upiId}</span>
                    </div>
                  ) : (
                    <p className="text-red-500 font-semibold text-center">Invalid details provided.</p>
                  )}
                </div>
              </div>

              {selectedWithdrawal.status === 'pending' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Admin Notes (Optional)</label>
                    <textarea 
                      value={adminNotes} 
                      onChange={e => setAdminNotes(e.target.value)} 
                      placeholder="Transaction ID or reason for rejection..."
                      className="w-full border border-gray-200 rounded-lg p-3 resize-none h-24"
                    />
                  </div>
                  
                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => handleUpdateStatus('completed')}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={18} /> Mark Completed
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus('rejected')}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                    >
                      <XCircle size={18} /> Reject Request
                    </button>
                  </div>
                </>
              )}

              {selectedWithdrawal.status !== 'pending' && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-center">
                  <p className="text-sm font-semibold mb-2 text-gray-700">Status: {selectedWithdrawal.status.toUpperCase()}</p>
                  <p className="text-sm text-gray-500 bg-white p-3 rounded-lg">Notes: {selectedWithdrawal.adminNotes || 'No notes provided.'}</p>
                </div>
              )}
              
              <button 
                onClick={() => setSelectedWithdrawal(null)} 
                className="w-full text-center py-2 text-gray-500 hover:text-gray-800 font-medium mt-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWithdrawals;
