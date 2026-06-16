import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { Car, X } from 'lucide-react';

const AdminCabApprovals = () => {
  const [cabs, setCabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  useEffect(() => {
    fetchCabs();
  }, []);

  const fetchCabs = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      // Merge hotel linked and independent cabs for the single view
      const mergedCabs = [
        ...(res.data.data.unapprovedHotelCabs || []),
        ...(res.data.data.unapprovedIndependentCabs || [])
      ];
      setCabs(mergedCabs);
    } catch (err) {
      toast.error('Failed to fetch approvals');
    } finally {
      setLoading(false);
    }
  };

  const openDetails = async (id) => {
    try {
      const res = await api.get(`/admin/details/Cab/${id}`);
      setSelectedProvider({ ...res.data.data, providerType: 'Cab' });
      setShowModal(true);
      setShowRejectInput(false);
      setRejectReason('');
    } catch (err) {
      toast.error('Failed to fetch cab details');
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.post('/admin/approve', { id, type: 'Cab' });
      toast.success('Cab Approved!');
      setShowModal(false);
      fetchCabs();
    } catch (err) {
      toast.error('Failed to approve Cab');
    }
  };

  const handleReject = async (id) => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection.');
      return;
    }
    try {
      await api.post('/admin/reject', { id, type: 'Cab', reason: rejectReason });
      toast.success('Cab Rejected.');
      setShowModal(false);
      fetchCabs();
    } catch (err) {
      toast.error('Failed to reject Cab');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cab Approvals</h2>
          <p className="text-gray-500">Review and approve new cab and driver onboarding requests</p>
        </div>
        <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg font-bold flex items-center gap-2">
          <Car size={18} />
          Pending: {cabs.length}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {cabs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No pending cab approvals at this time.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                <tr>
                  <th className="py-4 px-6">Driver / Agency</th>
                  <th className="py-4 px-6">Provider</th>
                  <th className="py-4 px-6">Source Type</th>
                  <th className="py-4 px-6">Date Applied</th>
                  <th className="py-4 px-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cabs.map(c => (
                  <tr key={c._id} className="hover:bg-gray-50 transition">
                    <td className="py-4 px-6 font-semibold text-gray-900">
                      {c.agencyDetails?.agencyName || c.vendorDetails?.driverName || 'Unnamed Cab'}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">{c.providerId?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{c.providerId?.email}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${c.cabSourceType === 'HOTEL_LINKED' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {c.cabSourceType?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="py-4 px-6">
                      <button onClick={() => openDetails(c._id)} className="text-xs bg-primary text-white px-3 py-1.5 rounded hover:bg-primary-dark transition font-medium">
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">Cab / Driver Details</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div><span className="font-semibold text-gray-500">Provider Name:</span><p className="mt-1 font-medium">{selectedProvider.providerId?.name}</p></div>
                <div><span className="font-semibold text-gray-500">Email:</span><p className="mt-1 font-medium">{selectedProvider.providerId?.email}</p></div>
                
                {selectedProvider.cabSourceType === 'HOTEL_LINKED' ? (
                  <>
                    <div><span className="font-semibold text-gray-500">Linked Hotel:</span><p className="mt-1 font-medium text-primary">{selectedProvider.hotelId?.profile?.hotelName}</p></div>
                    <div><span className="font-semibold text-gray-500">Driver Name:</span><p className="mt-1 font-medium">{selectedProvider.vendorDetails?.driverName}</p></div>
                    <div><span className="font-semibold text-gray-500">Mobile:</span><p className="mt-1 font-medium">{selectedProvider.vendorDetails?.mobile}</p></div>
                  </>
                ) : (
                  <>
                    <div><span className="font-semibold text-gray-500">Agency Name:</span><p className="mt-1 font-medium">{selectedProvider.agencyDetails?.agencyName}</p></div>
                    <div><span className="font-semibold text-gray-500">Contact Number:</span><p className="mt-1 font-medium">{selectedProvider.agencyDetails?.contactNumber}</p></div>
                  </>
                )}
              </div>

              {selectedProvider.vehicleDetails && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <h4 className="font-semibold text-gray-700 mb-4 border-b pb-2">Vehicle Information</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div><span className="text-gray-500 block">Type</span><span className="font-medium">{selectedProvider.vehicleDetails.vehicleType}</span></div>
                    <div><span className="text-gray-500 block">Model</span><span className="font-medium">{selectedProvider.vehicleDetails.model}</span></div>
                    <div><span className="text-gray-500 block">Reg Number</span><span className="font-medium">{selectedProvider.vehicleDetails.registrationNumber}</span></div>
                    <div><span className="text-gray-500 block">Seating</span><span className="font-medium">{selectedProvider.vehicleDetails.seatingCapacity}</span></div>
                    <div><span className="text-gray-500 block">AC</span><span className="font-medium">{selectedProvider.vehicleDetails.isAC ? 'Yes' : 'No'}</span></div>
                    <div><span className="text-gray-500 block">Fuel</span><span className="font-medium">{selectedProvider.vehicleDetails.fuelType}</span></div>
                  </div>
                </div>
              )}
              
              {selectedProvider.documents && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mt-4">
                  <h4 className="font-semibold text-gray-700 mb-3 border-b pb-2">Driver Documents & Banking</h4>
                  <div className="flex flex-wrap gap-4 mb-4">
                    {selectedProvider.vendorDetails?.driverPhoto && (
                      <a href={selectedProvider.vendorDetails.driverPhoto} target="_blank" rel="noreferrer" className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition text-sm font-medium">
                        Driver Photo
                      </a>
                    )}
                    {selectedProvider.documents.drivingLicense && (
                      <a href={selectedProvider.documents.drivingLicense} target="_blank" rel="noreferrer" className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition text-sm font-medium">
                        Driving License
                      </a>
                    )}
                    {selectedProvider.documents.driverId && (
                      <a href={selectedProvider.documents.driverId} target="_blank" rel="noreferrer" className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition text-sm font-medium">
                        Aadhaar / ID Card
                      </a>
                    )}
                  </div>
                  
                  {selectedProvider.documents.bankDetails && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h5 className="font-medium text-gray-700 mb-2 text-sm">Bank Details</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div><span className="text-gray-500 block text-xs">Account Holder</span><span className="font-medium">{selectedProvider.documents.bankDetails.accountHolder}</span></div>
                        <div><span className="text-gray-500 block text-xs">Bank Name</span><span className="font-medium">{selectedProvider.documents.bankDetails.bankName}</span></div>
                        <div><span className="text-gray-500 block text-xs">Account Number</span><span className="font-medium">{selectedProvider.documents.bankDetails.accountNumber}</span></div>
                        <div><span className="text-gray-500 block text-xs">IFSC Code</span><span className="font-medium">{selectedProvider.documents.bankDetails.ifscCode}</span></div>
                      </div>
                    </div>
                  )}
                </div>
              )}
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

export default AdminCabApprovals;
