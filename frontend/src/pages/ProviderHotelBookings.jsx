import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { FileText, Calendar, Users, IndianRupee } from 'lucide-react';

const ProviderHotelBookings = () => {
  const { activeService } = useOutletContext();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchBookings = async () => {
      try {
        const res = await api.get('/providers/hotel-bookings');
        setBookings(res.data.data || []);
      } catch (error) {
        toast.error('Failed to fetch hotel bookings');
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    if (activeService === 'hotel') {
      fetchBookings();
    } else {
      setLoading(false);
    }
  }, [activeService]);

  const handleStatusUpdate = async (id, status) => {
    if (status === 'rejected' && !window.confirm('Are you sure you want to reject this booking? The room will be released.')) return;
    
    setActionLoading(id);
    try {
      await api.patch(`/providers/hotel-bookings/${id}/status`, { status });
      toast.success(`Booking ${status} successfully.`);
      fetchBookings();
      setShowDetailsModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update booking status.');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
      failed: 'bg-red-100 text-red-800',
      hold_created: 'bg-yellow-100 text-yellow-800',
      payment_pending: 'bg-orange-100 text-orange-800',
      pending_approval: 'bg-indigo-100 text-indigo-800',
      checked_in: 'bg-purple-100 text-purple-800',
      cancellation_requested: 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatStatus = (s) => s?.replace(/_/g, ' ').toUpperCase() || 'UNKNOWN';

  if (activeService !== 'hotel') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Switch to Hotel Service</h2>
        <p className="text-gray-500">You must be in Hotel mode to view your bookings.</p>
      </div>
    );
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Loading bookings...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FileText className="text-primary" /> Incoming Hotel Bookings
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No bookings found for your hotel yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 font-semibold text-gray-600">Booking ID</th>
                  <th className="p-4 font-semibold text-gray-600">Guest</th>
                  <th className="p-4 font-semibold text-gray-600">Dates</th>
                  <th className="p-4 font-semibold text-gray-600">Room Details</th>
                  <th className="p-4 font-semibold text-gray-600">Amount</th>
                  <th className="p-4 font-semibold text-gray-600">Status</th>
                  <th className="p-4 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => {
                  const hb = b.hotelBooking;
                  const isPending = hb?.status === 'pending_approval';
                  return (
                    <tr key={b._id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="p-4 font-mono text-sm text-gray-600">
                        {b.bookingId}
                        <br />
                        <span className="text-xs text-gray-400">{new Date(b.createdAt).toLocaleDateString()}</span>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-gray-800">{hb?.guestDetails?.fullName || b.userId?.name || 'Guest'}</p>
                        <p className="text-xs text-gray-500">{hb?.guestDetails?.mobile}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm font-medium text-gray-800">{new Date(hb?.checkInDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} → {new Date(hb?.checkOutDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm font-medium text-gray-800">{b.roomType}</p>
                        <p className="text-xs text-gray-500">{hb?.roomsCount} Room(s), {hb?.guestDetails?.guestCount} Guest(s)</p>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-gray-900">₹{b.totalAmount}</p>
                        <p className={`text-xs font-semibold ${b.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                          {b.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                        </p>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(hb?.status)}`}>
                          {formatStatus(hb?.status)}
                        </span>
                      </td>
                      <td className="p-4 flex gap-2">
                        <button onClick={() => { setSelectedBooking(b); setShowDetailsModal(true); }} className="text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded font-semibold hover:bg-blue-100 transition">
                          View
                        </button>
                        {isPending && (
                          <>
                            <button disabled={actionLoading === b._id} onClick={() => handleStatusUpdate(b._id, 'confirmed')} className={`text-sm bg-green-500 text-white px-3 py-1.5 rounded font-semibold hover:bg-green-600 transition ${actionLoading === b._id ? 'opacity-50' : ''}`}>
                              Approve
                            </button>
                            <button disabled={actionLoading === b._id} onClick={() => handleStatusUpdate(b._id, 'rejected')} className={`text-sm bg-red-500 text-white px-3 py-1.5 rounded font-semibold hover:bg-red-600 transition ${actionLoading === b._id ? 'opacity-50' : ''}`}>
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Details Modal */}
      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">Booking Details: {selectedBooking.bookingId}</h2>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-500 hover:text-gray-800">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6 text-sm">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <h3 className="font-bold text-blue-900 mb-3 border-b border-blue-200 pb-2">Guest Information</h3>
                  <div className="space-y-2 text-blue-800">
                    <p><span className="font-semibold">Full Name:</span> {selectedBooking.hotelBooking?.guestDetails?.fullName || selectedBooking.userId?.name}</p>
                    <p><span className="font-semibold">Mobile:</span> {selectedBooking.hotelBooking?.guestDetails?.mobile}</p>
                    <p><span className="font-semibold">Email:</span> {selectedBooking.hotelBooking?.guestDetails?.email || selectedBooking.userId?.email}</p>
                    <p><span className="font-semibold">Special Requests:</span> {selectedBooking.hotelBooking?.guestDetails?.specialRequests || 'None'}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <h3 className="font-bold text-gray-800 mb-3 border-b border-gray-200 pb-2">Stay Details</h3>
                  <div className="space-y-2 text-gray-600">
                    <p><span className="font-semibold text-gray-800">Check-in:</span> {new Date(selectedBooking.hotelBooking?.checkInDate).toLocaleDateString()}</p>
                    <p><span className="font-semibold text-gray-800">Check-out:</span> {new Date(selectedBooking.hotelBooking?.checkOutDate).toLocaleDateString()}</p>
                    <p><span className="font-semibold text-gray-800">Room Type:</span> {selectedBooking.roomType}</p>
                    <p><span className="font-semibold text-gray-800">Guests:</span> {selectedBooking.hotelBooking?.guestDetails?.guestCount || selectedBooking.hotelBooking?.guests?.adults} Adults</p>
                    <p><span className="font-semibold text-gray-800">Rooms Booked:</span> {selectedBooking.hotelBooking?.roomsCount}</p>
                    <p><span className="font-semibold text-gray-800">Need Cab Pickup:</span> {selectedBooking.hotelBooking?.needPickupCab === 'yes' ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-3 border-b border-gray-200 pb-2">Payment Information</h3>
                <div className="flex justify-between items-center text-gray-600">
                  <div>
                    <p><span className="font-semibold text-gray-800">Total Amount:</span> ₹{selectedBooking.totalAmount}</p>
                    <p><span className="font-semibold text-gray-800">Payment Mode:</span> {selectedBooking.paymentMode === 'online' ? 'Paid Online' : 'Pay at Hotel'}</p>
                    <p><span className="font-semibold text-gray-800">Payment Status:</span> <span className={`font-bold ${selectedBooking.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>{selectedBooking.paymentStatus.toUpperCase()}</span></p>
                  </div>
                  <div className="text-right">
                    <p><span className="font-semibold text-gray-800">Platform Commission:</span> ₹{selectedBooking.platformCommission}</p>
                    <p><span className="font-semibold text-gray-800">Your Earning:</span> <span className="font-bold text-primary">₹{selectedBooking.partnerEarning}</span></p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-4">
              {selectedBooking.hotelBooking?.status === 'pending_approval' && (
                <>
                  <button onClick={() => handleStatusUpdate(selectedBooking._id, 'rejected')} disabled={actionLoading === selectedBooking._id} className={`bg-red-100 text-red-700 px-6 py-2 rounded font-bold hover:bg-red-200 transition ${actionLoading === selectedBooking._id ? 'opacity-50' : ''}`}>
                    Reject Booking
                  </button>
                  <button onClick={() => handleStatusUpdate(selectedBooking._id, 'confirmed')} disabled={actionLoading === selectedBooking._id} className={`bg-green-500 text-white px-8 py-2 rounded font-bold hover:bg-green-600 shadow-md transition ${actionLoading === selectedBooking._id ? 'opacity-50' : ''}`}>
                    Approve Booking
                  </button>
                </>
              )}
              <button onClick={() => setShowDetailsModal(false)} className="bg-gray-200 text-gray-800 px-6 py-2 rounded font-bold hover:bg-gray-300 transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProviderHotelBookings;
