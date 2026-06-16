import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { ShieldCheck, Calendar, MapPin, Building2, Car } from 'lucide-react';

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/admin/bookings');
      setBookings(res.data.data);
    } catch (err) {
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">All Bookings</h2>
          <p className="text-gray-500">View and monitor all hotel and cab bookings across the platform</p>
        </div>
        <div className="bg-primary/10 text-primary px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
          <ShieldCheck size={18} />
          Total Bookings: {bookings.length}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
              <tr>
                <th className="py-4 px-6">ID & Date</th>
                <th className="py-4 px-6">Customer</th>
                <th className="py-4 px-6">Service Type</th>
                <th className="py-4 px-6">Service Details</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bookings.map(booking => (
                <tr key={booking._id} className="hover:bg-gray-50 transition">
                  <td className="py-4 px-6">
                    <div className="font-semibold text-gray-900">#{booking.bookingId.slice(-6).toUpperCase()}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <Calendar size={12} />
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-medium text-gray-900">{booking.userId?.name || 'Unknown'}</div>
                    <div className="text-xs text-gray-500">{booking.userId?.email}</div>
                  </td>
                  <td className="py-4 px-6">
                    {booking.bookingType === 'HOTEL' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        <Building2 size={12} /> Hotel
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                        <Car size={12} /> Cab
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-gray-600 max-w-xs truncate">
                    {booking.bookingType === 'HOTEL' ? (
                      <div>{booking.hotelBooking?.hotelId?.profile?.hotelName || 'Unknown Hotel'}</div>
                    ) : (
                      <div>
                        {booking.cabBooking?.pickupLocation?.address?.split(',')[0]} → {booking.cabBooking?.dropLocation?.address?.split(',')[0]}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-medium text-xs uppercase tracking-wider text-gray-700 bg-gray-100 px-2 py-1 rounded">
                      {booking.bookingType === 'HOTEL' ? booking.hotelBooking?.status : booking.cabBooking?.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-semibold text-gray-900">
                    ₹{booking.totalAmount}
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500">No bookings found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminBookings;
