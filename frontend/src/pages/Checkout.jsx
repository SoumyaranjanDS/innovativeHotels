import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axios';

const Checkout = () => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(0); 
  const [holdData, setHoldData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  const searchParams = new URLSearchParams(window.location.search);
  const hotelId = searchParams.get('hotelId');
  const roomId = searchParams.get('roomId');

  useEffect(() => {
    const acquireHold = async () => {
      try {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const res = await api.post('/hotels/hold', {
          hotelId,
          roomId,
          checkInDate: today.toISOString(),
          checkOutDate: tomorrow.toISOString(),
          roomsCount: 1,
          guests: { adults: 2, children: 0 }
        });
        
        setHoldData(res.data.hold);
        const expiresAt = new Date(res.data.hold.expiresAt).getTime();
        const now = new Date().getTime();
        setTimeLeft(Math.floor((expiresAt - now) / 1000));
        setLoading(false);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to hold room. Please search again.');
        setLoading(false);
      }
    };
    acquireHold();
  }, []);

  // Simulate a 10-minute hold countdown
  useEffect(() => {
    if (timeLeft <= 0) return;
    const intervalId = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    if (seconds <= 0) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setConfirming(true);
    try {
      await api.post('/hotels/confirm', {
        holdId: holdData._id,
        guestDetails: { firstName: 'John', lastName: 'Doe', email: 'john@example.com', mobile: '1234567890' },
        paymentMethod: 'credit_card'
      });
      toast.success("Payment Successful! Booking Confirmed.");
      navigate('/'); // Redirect to home or dashboard
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to confirm booking.");
    } finally {
      setConfirming(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Acquiring Room Hold...</div>;
  if (!holdData) return <div className="min-h-screen flex items-center justify-center text-red-500">Failed to acquire room hold.</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4">
        
        {/* Header / Countdown */}
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-6 py-4 rounded-xl shadow-sm mb-8 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-lg">Room Held Successfully!</h2>
            <p className="text-sm mt-1">Please complete your payment to confirm the booking.</p>
          </div>
          <div className="text-right">
            <p className="text-sm uppercase tracking-wide font-semibold text-yellow-700">Time Remaining</p>
            <p className="text-3xl font-bold tabular-nums">{formatTime(timeLeft)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Guest Details Form */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Guest Details</h3>
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input type="text" className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" defaultValue="John" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input type="text" className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" defaultValue="Doe" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" defaultValue="john@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                  <input type="tel" className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" defaultValue="+1 234 567 890" />
                </div>
              </form>
            </div>

            {/* Payment Method */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Payment Method</h3>
              <div className="space-y-4">
                <label className="flex items-center p-4 border border-primary rounded-lg cursor-pointer bg-red-50">
                  <input type="radio" name="payment" className="w-4 h-4 text-primary focus:ring-primary" defaultChecked />
                  <span className="ml-3 font-medium text-gray-800">Credit / Debit Card (Razorpay)</span>
                </label>
                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
                  <input type="radio" name="payment" className="w-4 h-4 text-primary focus:ring-primary" />
                  <span className="ml-3 font-medium text-gray-800">Pay at Hotel</span>
                </label>
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Booking Summary</h3>
              
              <div className="mb-6">
                <p className="font-bold text-gray-800 text-lg">Grand Plaza Hotel</p>
                <p className="text-sm text-gray-500">New York City, NY</p>
              </div>

              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Check-in</span>
                <span className="font-semibold text-gray-800">{new Date(holdData.checkInDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm mb-4">
                <span className="text-gray-600">Check-out</span>
                <span className="font-semibold text-gray-800">{new Date(holdData.checkOutDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm mb-6 pb-6 border-b">
                <span className="text-gray-600">Rooms</span>
                <span className="font-semibold text-gray-800">{holdData.roomsCount}</span>
              </div>

              <div className="space-y-3 mb-6 border-b pb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Base Price</span>
                  <span>₹{holdData.priceSnapshot.basePrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Taxes</span>
                  <span>₹{holdData.priceSnapshot.taxAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-8">
                <span className="text-lg font-bold text-gray-800">Total Amount</span>
                <span className="text-2xl font-bold text-primary">₹{holdData.priceSnapshot.totalPrice.toFixed(2)}</span>
              </div>

              <button 
                onClick={handlePayment}
                disabled={timeLeft <= 0 || confirming}
                className={`w-full py-4 rounded-md font-bold text-lg transition shadow-md ${(timeLeft > 0 && !confirming) ? 'bg-primary text-white hover:bg-primary-light' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
              >
                {confirming ? 'Processing...' : (timeLeft > 0 ? `Pay ₹${holdData.priceSnapshot.totalPrice.toFixed(2)} & Confirm` : 'Hold Expired')}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Checkout;
