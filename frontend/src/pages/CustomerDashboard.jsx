import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';

const CustomerDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await api.get('/bookings/my');
        setBookings(res.data.data);
      } catch (err) {
        toast.error('Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading Bookings...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">My Trips & Bookings</h1>

        {bookings.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 mb-4">You have no bookings yet.</p>
            <Link to="/" className="text-primary font-semibold hover:underline">Start Exploring</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => (
              <div key={b._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${b.serviceType === 'Hotel' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {b.serviceType}
                    </span>
                    <span className="text-sm text-gray-500">{new Date(b.createdAt).toLocaleDateString()}</span>
                    <span className={`text-sm font-bold ${b.status === 'cancelled' ? 'text-red-500' : 'text-green-500'}`}>
                      {b.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-lg">Booking #{b.bookingCode}</h3>
                  
                  {b.serviceType === 'Cab' && b.cabBooking && (
                    <div className="text-sm text-gray-600 mt-2">
                      <p><strong>Pickup:</strong> {b.cabBooking.pickupLocation?.address}</p>
                      <p><strong>Drop:</strong> {b.cabBooking.dropLocation?.address}</p>
                      <p><strong>Driver Status:</strong> {b.cabBooking.cabBookingStatus.replace(/_/g, ' ')}</p>
                    </div>
                  )}

                  {b.serviceType === 'Hotel' && (
                     <div className="text-sm text-gray-600 mt-2">
                        <p><strong>Check In:</strong> {new Date(b.dates.checkIn).toLocaleDateString()}</p>
                        <p><strong>Check Out:</strong> {new Date(b.dates.checkOut).toLocaleDateString()}</p>
                     </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <p className="text-xl font-bold text-gray-900">₹{b.payment?.totalAmount}</p>
                  
                  {b.serviceType === 'Cab' && ['requested', 'accepted', 'on_the_way', 'arrived_at_pickup', 'trip_started'].includes(b.cabBooking?.cabBookingStatus) && (
                    <Link 
                      to={`/cab-tracking/${b._id}`}
                      className="px-4 py-2 bg-primary text-white rounded-md text-sm font-bold hover:bg-primary-light transition"
                    >
                      Live Tracking
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;
