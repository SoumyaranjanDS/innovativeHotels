import { useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { Phone, User as UserIcon, Car, ChevronDown, ChevronUp, MapPin, Clock } from 'lucide-react';

const CabDriverDashboard = () => {
  const [allRides, setAllRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);

  const fetchRides = async () => {
    try {
      setLoading(true);
      const res = await api.get('/cabs/driver/rides/history?limit=100');
      const completed = (res.data.history || []).filter(r => r.cabBooking?.status === 'completed');
      setAllRides(completed);
    } catch {
      toast.error('Failed to load rides');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides(); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-500 font-medium">Loading rides...</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">All Completed Rides</h1>
      
      {allRides.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <Car size={24} className="text-gray-400" />
          </div>
          <h3 className="text-gray-900 font-bold text-lg">No Completed Rides</h3>
          <p className="text-gray-500 text-sm mt-1">Completed rides will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {allRides.map((ride, i) => {
            const isExpanded = expandedRow === i;

            return (
              <div key={ride._id || i} className={`bg-white border rounded-xl overflow-hidden transition-all ${isExpanded ? 'border-indigo-200 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>
                <button className="w-full text-left" onClick={() => setExpandedRow(isExpanded ? null : i)}>
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-xs text-gray-400 font-mono">{ride.bookingId}</span>
                        <span className="text-xs text-gray-400">{new Date(ride.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ride.cabBooking?.paymentMode === 'online' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                          {ride.cabBooking?.paymentMode === 'online' ? 'Online' : 'Cash'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="text-gray-500 truncate max-w-[180px]">{ride.cabBooking?.pickupLocation?.address?.split(',')[0]}</span>
                        <span className="text-gray-300">→</span>
                        <span className="text-gray-700 font-medium truncate max-w-[180px]">{ride.cabBooking?.dropLocation?.address?.split(',')[0]}</span>
                      </div>
                      <div className="flex gap-3 mt-1 text-xs text-gray-400">
                        {ride.userId?.name && <span>👤 {ride.userId.name}</span>}
                        {ride.driverInfo?.name && <span>🚗 {ride.driverInfo.name}</span>}
                        {ride.cabBooking?.vehicleType && <span>{ride.cabBooking.vehicleType}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-base font-black text-gray-900">₹{ride.totalAmount?.toLocaleString()}</p>
                        {ride.netAmount != null && (
                          <p className="text-xs text-green-600 font-semibold">Net ₹{ride.netAmount?.toLocaleString()}</p>
                        )}
                      </div>
                      {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </div>
                  </div>
                </button>

                {/* Expanded Panel */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/40 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                    {/* Customer */}
                    <div className="bg-white border border-gray-100 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 flex items-center gap-1"><UserIcon size={11} /> Customer</p>
                      <p className="font-semibold text-sm text-gray-900">{ride.userId?.name || '—'}</p>
                      {ride.userId?.mobile && (
                        <a href={`tel:${ride.userId.mobile}`} className="text-xs text-indigo-600 flex items-center gap-1 mt-1 hover:underline">
                          <Phone size={11} /> {ride.userId.mobile}
                        </a>
                      )}
                      {ride.userId?.email && <p className="text-xs text-gray-400 mt-0.5 truncate">{ride.userId.email}</p>}
                    </div>

                    {/* Driver */}
                    <div className="bg-white border border-gray-100 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 flex items-center gap-1"><Car size={11} /> Driver</p>
                      <p className="font-semibold text-sm text-gray-900">{ride.driverInfo?.name || ride.cabBooking?.driverName || 'Not assigned'}</p>
                      {ride.driverInfo?.mobile && (
                        <a href={`tel:${ride.driverInfo.mobile}`} className="text-xs text-indigo-600 flex items-center gap-1 mt-1 hover:underline">
                          <Phone size={11} /> {ride.driverInfo.mobile}
                        </a>
                      )}
                    </div>

                    {/* Trip Details */}
                    <div className="bg-white border border-gray-100 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 flex items-center gap-1"><MapPin size={11} /> Trip</p>
                      <div className="space-y-1.5">
                        <p className="text-xs text-gray-600 flex gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400 mt-1 shrink-0"></span><span>{ride.cabBooking?.pickupLocation?.address}</span></p>
                        <p className="text-xs text-gray-600 flex gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400 mt-1 shrink-0"></span><span>{ride.cabBooking?.dropLocation?.address}</span></p>
                        <div className="flex gap-2 text-xs text-gray-400 pt-1 border-t border-gray-50">
                          <span>{ride.cabBooking?.vehicleType}</span>·<span>{ride.cabBooking?.passengers} pax</span>
                        </div>
                      </div>
                    </div>

                    {/* Revenue */}
                    <div className="bg-white border border-gray-100 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 flex items-center gap-1"><Clock size={11} /> Revenue</p>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Total Fare</span>
                          <span className="font-bold text-gray-900">₹{ride.totalAmount?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs border-t border-gray-50 pt-1">
                          <span className="text-gray-500">Platform Fee</span>
                          <span className="font-semibold text-red-500">- ₹{ride.platformFee?.toLocaleString() ?? '—'}</span>
                        </div>
                        <div className="flex justify-between text-xs border-t border-gray-100 pt-1">
                          <span className="text-green-700 font-bold">Net Earnings</span>
                          <span className="font-black text-green-700">₹{ride.netAmount?.toLocaleString() ?? '—'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CabDriverDashboard;
