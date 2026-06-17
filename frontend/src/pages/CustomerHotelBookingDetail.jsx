import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { MapPin, Calendar, Users, CreditCard, ChevronLeft, Download, AlertCircle, FileText, CheckCircle, Clock, XCircle, Info, Star } from 'lucide-react';
import CancelBookingModal from '../components/booking/CancelBookingModal';
import ModifyBookingModal from '../components/booking/ModifyBookingModal';
import ReviewForm from '../components/booking/ReviewForm';
import SupportTicketForm from '../components/booking/SupportTicketForm';
import HotelCabSuggestion from '../components/cab/HotelCabSuggestion';

const CustomerHotelBookingDetail = () => {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);

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

  useEffect(() => {
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
        <div className="text-center">
          <p className="text-gray-500 mb-4">Booking not found.</p>
          <Link to="/customer-dashboard" className="text-primary hover:underline font-semibold">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const hb = booking.hotelBooking;
  const nights = hb?.dates?.length || 0;

  const canCancel = ['confirmed', 'payment_pending', 'hold_created'].includes(hb?.status);
  const canModify = hb?.status === 'confirmed';
  const isCompleted = hb?.status === 'completed';

  const formatStatus = (s) => s?.replace(/_/g, ' ').toUpperCase();

  const getStatusUI = (status) => {
    const config = {
      confirmed: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
      completed: { icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
      cancelled: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
      failed: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
      hold_created: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
      payment_pending: { icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
      pending_approval: { icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' },
      checked_in: { icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
      cancellation_requested: { icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' }
    };
    return config[status] || { icon: Info, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' };
  };

  const statusUI = getStatusUI(hb?.status);
  const StatusIcon = statusUI.icon;

  return (
    <div className="min-h-screen bg-background pt-24 pb-8">
      <div className="max-w-5xl mx-auto px-4">
        
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <Link to="/customer-dashboard" className="flex items-center gap-1 text-gray-500 hover:text-gray-900 transition font-medium">
            <ChevronLeft size={18} /> Back to Dashboard
          </Link>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition flex items-center gap-2">
              <Download size={16} /> Invoice
            </button>
            {canModify && (
              <button onClick={() => setShowModifyModal(true)} className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-semibold hover:bg-primary/20 transition">
                Modify Booking
              </button>
            )}
            {canCancel && (
              <button onClick={() => setShowCancelModal(true)} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-100 transition">
                Cancel Booking
              </button>
            )}
          </div>
        </div>

        {/* Modification Request Status */}
        {hb?.modificationRequest?.status === 'pending' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="text-blue-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-800">Modification Request Pending</h4>
              <p className="text-sm text-blue-700">Your request to modify this booking is under review by the hotel. We will notify you once it is processed.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Status Header */}
            <div className={`p-6 border rounded-2xl flex items-center gap-4 mb-6 ${statusUI.bg}`}>
              <div className={`p-3 rounded-full bg-white shadow-sm ${statusUI.color}`}>
                <StatusIcon size={28} />
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${statusUI.color}`}>{formatStatus(hb.status)}</h2>
                <p className="text-sm opacity-80 text-gray-700 mt-1">
                  {hb.status === 'confirmed' ? 'Your booking is confirmed. Have a great stay!' : 
                   hb.status === 'cancelled' ? 'This booking has been cancelled.' : 
                   hb.status === 'pending_approval' ? 'Your booking is currently pending approval by the hotel.' :
                   'Booking status is ' + formatStatus(hb.status)}
                </p>
              </div>
            </div>

            {/* Hotel & Room Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-400 font-mono mb-1">Booking ID: {booking.bookingId}</p>
                  <h1 className="text-2xl font-bold text-gray-900">{booking.hotelName}</h1>
                  <p className="text-gray-500 flex items-center gap-1 mt-1"><MapPin size={16} /> {booking.hotelAddress}, {booking.hotelCity}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 py-6 border-t border-b border-gray-100">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Check-in</p>
                  <p className="font-bold text-gray-800">{new Date(hb?.checkInDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                  <p className="text-xs text-gray-500">{booking.checkInTime}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Check-out</p>
                  <p className="font-bold text-gray-800">{new Date(hb?.checkOutDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                  <p className="text-xs text-gray-500">{booking.checkOutTime}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Guests</p>
                  <p className="font-bold text-gray-800">{hb?.guestDetails?.guestCount} Guests</p>
                  <p className="text-xs text-gray-500">{hb?.roomsCount} Room{hb?.roomsCount > 1 ? 's' : ''}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Duration</p>
                  <p className="font-bold text-gray-800">{nights} Night{nights > 1 ? 's' : ''}</p>
                </div>
              </div>

              <div className="mt-6 flex items-start gap-4">
                <img src={booking.roomPhoto || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=200&q=80'} alt="Room" className="w-24 h-24 object-cover rounded-xl" />
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{booking.roomType}</h3>
                  {booking.roomAmenities?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {booking.roomAmenities.slice(0, 4).map((a, i) => (
                        <span key={i} className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded border border-gray-100">{a}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Guest Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Primary Guest Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                <div><p className="text-xs text-gray-400">Full Name</p><p className="font-semibold text-gray-800">{hb?.guestDetails?.fullName}</p></div>
                <div><p className="text-xs text-gray-400">Mobile</p><p className="font-semibold text-gray-800">{hb?.guestDetails?.mobile}</p></div>
                <div><p className="text-xs text-gray-400">Email</p><p className="font-semibold text-gray-800">{hb?.guestDetails?.email}</p></div>
                <div><p className="text-xs text-gray-400">ID Proof</p><p className="font-semibold text-gray-800">{hb?.guestDetails?.idProofType} ({hb?.guestDetails?.idProofNumber || 'Not provided'})</p></div>
                {hb?.guestDetails?.specialRequest && (
                  <div className="md:col-span-2 mt-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Special Request:</p>
                    <p className="text-sm text-gray-700 italic">"{hb.guestDetails.specialRequest}"</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Payment Summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Payment Summary</h2>
              
              <div className="space-y-3 text-sm mb-4 pb-4 border-b border-gray-100">
                <div className="flex justify-between"><span className="text-gray-600">Total Amount</span><span className="font-semibold">₹{booking.totalAmount?.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 text-xs">Includes Taxes</span><span className="text-gray-500 text-xs">₹{booking.taxAmount?.toLocaleString()}</span></div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600 font-medium">Payment Status</span>
                <span className={`px-2 py-1 rounded text-xs font-bold ${booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {booking.paymentStatus === 'paid' ? 'Paid Online' : booking.paymentMode === 'pay_at_hotel' ? 'Pay at Hotel' : 'Pending'}
                </span>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <FileText size={16} /> Cancellation Policy
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{booking.cancellationPolicy || 'Standard cancellation policy applies.'}</p>
              </div>
            </div>

            {/* Review Section */}
            {isCompleted && !booking.hasReview && (
              <ReviewForm bookingId={booking._id} onSuccess={fetchBooking} />
            )}
            {booking.hasReview && booking.review && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Your Review</h3>
                <div className="flex items-center gap-1 mb-2 text-accent">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={16} className={i < booking.review.rating ? 'fill-accent' : 'text-gray-200'} />
                  ))}
                </div>
                <p className="text-sm text-gray-600 italic">"{booking.review.comment}"</p>
              </div>
            )}
            
            {/* Cab Suggestion Box */}
            {hb?.status === 'confirmed' && (
              <div className="mb-8">
                <HotelCabSuggestion 
                  hotelId={hb.hotelId} 
                  hotelBookingId={booking._id} 
                  hotelAddress={`${booking.hotelAddress}, ${booking.hotelCity}`.replace(/^,\s/, '')} 
                />
              </div>
            )}

            {/* Support Ticket Section */}
            <SupportTicketForm bookingId={booking._id} />

          </div>
        </div>
      </div>

      <CancelBookingModal 
        isOpen={showCancelModal} 
        onClose={() => setShowCancelModal(false)} 
        booking={booking} 
        onStatusChange={(status) => {
          setBooking(prev => ({...prev, hotelBooking: {...prev.hotelBooking, status}}));
        }}
      />
      
      <ModifyBookingModal 
        isOpen={showModifyModal} 
        onClose={() => setShowModifyModal(false)} 
        booking={booking} 
        onModifySuccess={fetchBooking}
      />
    </div>
  );
};

export default CustomerHotelBookingDetail;
