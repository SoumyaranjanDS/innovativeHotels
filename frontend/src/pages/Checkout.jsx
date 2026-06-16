import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const hotelId = searchParams.get('hotelId');
  const roomId = searchParams.get('roomId');
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');
  const guests = searchParams.get('guests') || '1';
  const rooms = searchParams.get('rooms') || '1';

  const [timeLeft, setTimeLeft] = useState(0);
  const [holdData, setHoldData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [paymentMode, setPaymentMode] = useState('online');

  const [guestDetails, setGuestDetails] = useState({
    fullName: user?.name || '',
    mobile: '',
    email: user?.email || '',
    guestCount: parseInt(guests) || 1,
    expectedArrivalTime: '14:00',
    idProofType: 'Aadhaar',
    idProofNumber: '',
    additionalGuests: [],
    specialRequest: '',
  });
  const [needPickupCab, setNeedPickupCab] = useState('no');

  // Acquire hold on mount
  useEffect(() => {
    const acquireHold = async () => {
      if (!hotelId || !roomId || !checkIn || !checkOut) {
        toast.error('Missing booking parameters');
        setLoading(false);
        return;
      }
      try {
        const res = await api.post('/hotels/hold', {
          hotelId,
          roomId,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          roomsCount: parseInt(rooms) || 1,
          guests: { adults: parseInt(guests) || 1, children: 0 },
        });
        setHoldData(res.data.hold);
        const expiresAt = new Date(res.data.hold.expiresAt).getTime();
        const now = Date.now();
        setTimeLeft(Math.max(0, Math.floor((expiresAt - now) / 1000)));
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to hold room. Please search again.');
      } finally {
        setLoading(false);
      }
    };
    acquireHold();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const id = setInterval(() => setTimeLeft((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(id);
  }, [timeLeft]);

  const formatTime = (s) => {
    if (s <= 0) return '0:00';
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  };

  const handleConfirm = async () => {
    if (!guestDetails.fullName.trim()) { toast.error('Guest name is required'); return; }
    if (!guestDetails.mobile.trim()) { toast.error('Mobile number is required'); return; }
    if (!guestDetails.email.trim()) { toast.error('Email is required'); return; }

    setConfirming(true);
    try {
      const res = await api.post('/hotels/confirm', {
        holdId: holdData._id,
        guestDetails,
        paymentMode,
        needPickupCab,
      });
      toast.success('Booking confirmed successfully!');
      navigate(`/hotel-booking/confirmation/${res.data.booking._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to confirm booking.');
    } finally {
      setConfirming(false);
    }
  };

  const nights = holdData?.dates?.length || 0;
  const holdExpired = timeLeft <= 0 && holdData;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-lg">Reserving your room...</p>
        </div>
      </div>
    );
  }

  if (!holdData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Unable to Reserve Room</h2>
          <p className="text-gray-500 mb-6">The room may no longer be available. Please try again.</p>
          <Link to="/" className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-light transition">Search Again</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Hold Timer */}
        <div className={`${holdExpired ? 'bg-red-50 border-red-200 text-red-800' : 'bg-yellow-50 border-yellow-200 text-yellow-800'} border px-6 py-4 rounded-2xl shadow-sm mb-8 flex justify-between items-center`}>
          <div>
            <h2 className="font-bold text-lg">{holdExpired ? 'Room Hold Expired' : 'Room Held Successfully!'}</h2>
            <p className="text-sm mt-1">{holdExpired ? 'Your room hold has expired. Please select the room again.' : 'Complete your booking before the timer runs out.'}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide font-semibold opacity-70">Time Remaining</p>
            <p className={`text-3xl font-bold tabular-nums ${holdExpired ? 'text-red-600' : ''}`}>{formatTime(timeLeft)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hotel Info */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={16} className="text-green-600" />
                <span className="text-xs text-green-600 font-semibold">Verified Property</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">{holdData.hotelName}</h3>
              <p className="text-gray-500 text-sm">{holdData.hotelAddress}, {holdData.hotelCity}</p>
              <div className="flex gap-6 mt-3 text-sm text-gray-600">
                <span>Room: <strong>{holdData.roomType}</strong></span>
                <span>{nights} night{nights > 1 ? 's' : ''}</span>
                <span>{holdData.roomsCount} room{holdData.roomsCount > 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* Guest Details */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-5">Guest Details</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input type="text" value={guestDetails.fullName} onChange={(e) => setGuestDetails({ ...guestDetails, fullName: e.target.value })} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
                    <input type="tel" value={guestDetails.mobile} onChange={(e) => setGuestDetails({ ...guestDetails, mobile: e.target.value })} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition" placeholder="+91 98765 43210" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input type="email" value={guestDetails.email} onChange={(e) => setGuestDetails({ ...guestDetails, email: e.target.value })} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition" placeholder="john@example.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expected Arrival Time</label>
                    <input type="time" value={guestDetails.expectedArrivalTime} onChange={(e) => setGuestDetails({ ...guestDetails, expectedArrivalTime: e.target.value })} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ID Proof Type</label>
                    <select value={guestDetails.idProofType} onChange={(e) => setGuestDetails({ ...guestDetails, idProofType: e.target.value })} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition">
                      <option>Aadhaar</option>
                      <option>PAN Card</option>
                      <option>Passport</option>
                      <option>Driving License</option>
                      <option>Voter ID</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ID Proof Number</label>
                    <input type="text" value={guestDetails.idProofNumber} onChange={(e) => setGuestDetails({ ...guestDetails, idProofNumber: e.target.value })} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition" placeholder="ID Number" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests (optional)</label>
                  <textarea value={guestDetails.specialRequest} onChange={(e) => setGuestDetails({ ...guestDetails, specialRequest: e.target.value })} rows={3} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition resize-none" placeholder="Any special requirements..."></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Need pickup cab?</label>
                  <div className="flex gap-4">
                    {['no', 'yes', 'later'].map((opt) => (
                      <label key={opt} className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition ${needPickupCab === opt ? 'border-primary bg-primary/5 text-primary font-semibold' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                        <input type="radio" name="pickupCab" value={opt} checked={needPickupCab === opt} onChange={() => setNeedPickupCab(opt)} className="sr-only" />
                        {opt === 'no' ? 'No' : opt === 'yes' ? 'Yes' : 'Decide Later'}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Mode */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-5">Payment Method</h3>
              <div className="space-y-3">
                <label className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition ${paymentMode === 'online' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="payment" value="online" checked={paymentMode === 'online'} onChange={() => setPaymentMode('online')} className="w-4 h-4 text-primary focus:ring-primary" />
                  <div className="ml-3">
                    <span className="font-semibold text-gray-800">Pay Online</span>
                    <p className="text-xs text-gray-500">Secure mock payment · Instant confirmation</p>
                  </div>
                </label>
                <label className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition ${paymentMode === 'pay_at_hotel' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="payment" value="pay_at_hotel" checked={paymentMode === 'pay_at_hotel'} onChange={() => setPaymentMode('pay_at_hotel')} className="w-4 h-4 text-primary focus:ring-primary" />
                  <div className="ml-3">
                    <span className="font-semibold text-gray-800">Pay at Hotel</span>
                    <p className="text-xs text-gray-500">Pay when you check in</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right: Price Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-8">
              <h3 className="text-lg font-bold text-gray-800 mb-5">Price Summary</h3>

              <div className="space-y-3 text-sm mb-6 pb-6 border-b border-gray-100">
                <div className="flex justify-between"><span className="text-gray-500">Check-in</span><span className="font-semibold">{new Date(holdData.checkInDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Check-out</span><span className="font-semibold">{new Date(holdData.checkOutDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Duration</span><span className="font-semibold">{nights} night{nights > 1 ? 's' : ''}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Rooms</span><span className="font-semibold">{holdData.roomsCount}</span></div>
              </div>

              <div className="space-y-3 text-sm mb-6 pb-6 border-b border-gray-100">
                <div className="flex justify-between"><span className="text-gray-600">Room Charges</span><span>₹{holdData.priceSnapshot.basePrice.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Taxes & Fees</span><span>₹{holdData.priceSnapshot.taxAmount.toLocaleString()}</span></div>
                {holdData.priceSnapshot.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{holdData.priceSnapshot.discountAmount.toLocaleString()}</span></div>
                )}
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-bold text-gray-800">Total Payable</span>
                <span className="text-2xl font-bold text-primary">₹{holdData.priceSnapshot.totalPrice.toLocaleString()}</span>
              </div>

              {holdData.cancellationPolicy && (
                <p className="text-xs text-gray-400 mb-4 bg-gray-50 p-3 rounded-lg">{holdData.cancellationPolicy}</p>
              )}

              <button
                onClick={handleConfirm}
                disabled={holdExpired || confirming}
                className={`w-full py-4 rounded-xl font-bold text-lg transition shadow-md ${
                  !holdExpired && !confirming
                    ? 'bg-primary text-white hover:bg-primary-light'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                {confirming ? 'Processing...' : holdExpired ? 'Hold Expired — Go Back' : paymentMode === 'online' ? `Pay ₹${holdData.priceSnapshot.totalPrice.toLocaleString()} & Confirm` : 'Confirm Booking'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
