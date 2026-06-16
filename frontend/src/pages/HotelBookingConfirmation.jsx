import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { CheckCircle, MapPin, Calendar, Clock, Users, CreditCard, Car, ExternalLink } from 'lucide-react';
import HotelCabSuggestion from '../components/cab/HotelCabSuggestion';
import CabSuggestionBox from '../components/booking/CabSuggestionBox';

const HotelBookingConfirmation = () => {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await api.get(`/hotel-bookings/${bookingId}`);
        setBooking(res.data.data);
      } catch (err) {
        toast.error('Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-gray-500">Booking not found.</p>
      </div>
    );
  }

  const hb = booking.hotelBooking;
  const nights = hb?.dates?.length || 0;
  const isPendingApproval = hb?.status === 'pending_approval';

  return (
    <div className="min-h-screen bg-background pt-24 pb-10">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Banner */}
        <div className={`p-8 text-center rounded-2xl mb-8 border ${isPendingApproval ? 'bg-indigo-50 border-indigo-200' : 'bg-green-50 border-green-200'}`}>
          <CheckCircle size={56} className={`${isPendingApproval ? 'text-indigo-500' : 'text-green-500'} mx-auto mb-4`} />
          <h1 className={`text-3xl font-heading font-bold ${isPendingApproval ? 'text-indigo-800' : 'text-green-800'} mb-2`}>
            {isPendingApproval ? 'Booking Pending Approval' : 'Booking Confirmed!'}
          </h1>
          <p className={isPendingApproval ? 'text-indigo-700 text-lg' : 'text-green-700 text-lg'}>
            {isPendingApproval ? 'Your booking has been received and is pending hotel approval. We will notify you once confirmed.' : 'Your hotel stay has been successfully booked.'}
          </p>
          <p className={`${isPendingApproval ? 'text-indigo-600' : 'text-green-600'} mt-2`}>Booking ID: <strong className={isPendingApproval ? 'text-indigo-800' : 'text-green-800'}>{booking.bookingId}</strong></p>
        </div>

        {/* Cab Suggestion */}
        {hb && (
          <HotelCabSuggestion 
            hotelId={hb.hotelId?._id} 
            hotelBookingId={hb._id} 
            hotelAddress={`${hb.hotelId?.address?.street || ''}, ${hb.hotelId?.address?.city || ''}`} 
          />
        )}

        {/* Booking Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Booking Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Hotel</p>
                <p className="font-bold text-gray-900 text-lg">{booking.hotelName}</p>
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><MapPin size={14} /> {booking.hotelAddress}, {booking.hotelCity}</p>
              </div>
              <div className="flex gap-8">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Check-in</p>
                  <p className="font-semibold text-gray-800">{new Date(hb.checkInDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  <p className="text-xs text-gray-500">After {booking.checkInTime || '14:00'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Check-out</p>
                  <p className="font-semibold text-gray-800">{new Date(hb.checkOutDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  <p className="text-xs text-gray-500">Before {booking.checkOutTime || '11:00'}</p>
                </div>
              </div>
              <div className="flex gap-8 text-sm">
                <div><span className="text-gray-400">Duration:</span> <strong>{nights} night{nights > 1 ? 's' : ''}</strong></div>
                <div><span className="text-gray-400">Room:</span> <strong>{booking.roomType}</strong></div>
                <div><span className="text-gray-400">Rooms:</span> <strong>{hb.roomsCount}</strong></div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Guest Details</p>
                <p className="font-semibold text-gray-800">{hb.guestDetails?.fullName || 'Guest'}</p>
                <p className="text-sm text-gray-500">{hb.guestDetails?.email}</p>
                <p className="text-sm text-gray-500">{hb.guestDetails?.mobile}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Payment</p>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {booking.paymentStatus === 'paid' ? 'Paid' : booking.paymentMode === 'pay_at_hotel' ? 'Pay at Hotel' : 'Pending'}
                  </span>
                </div>
                <p className="text-2xl font-bold text-primary mt-2">₹{booking.totalAmount?.toLocaleString()}</p>
                <p className="text-xs text-gray-400">(incl. ₹{booking.taxAmount?.toLocaleString()} taxes)</p>
              </div>
            </div>
          </div>

          {booking.cancellationPolicy && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Cancellation Policy</p>
              <p className="text-sm text-gray-600">{booking.cancellationPolicy}</p>
            </div>
          )}

          {booking.hotelPhone && (
            <div className="mt-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Hotel Contact</p>
              <p className="text-sm text-gray-700 font-medium">{booking.hotelPhone}</p>
            </div>
          )}
        </div>

        {/* Cab Suggestion */}
        {(hb.needPickupCab === 'yes' || hb.needPickupCab === 'later') && (
          <div className="mb-6">
            <CabSuggestionBox hotelBookingId={booking._id} hotelAddress={`${booking.hotelAddress}, ${booking.hotelCity}`} />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to={`/hotel-booking/${booking._id}`} className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-light transition shadow-md flex items-center gap-2">
            <ExternalLink size={16} /> View Booking Details
          </Link>
          <Link to="/my-bookings" className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition flex items-center gap-2">
            My Bookings
          </Link>
          <Link to="/" className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HotelBookingConfirmation;
