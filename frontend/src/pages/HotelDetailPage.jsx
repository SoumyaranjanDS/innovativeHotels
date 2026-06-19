import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { MapPin, Star, ShieldCheck, Users, BedDouble, Wind, ChevronLeft, ChevronRight, Clock, AlertCircle } from 'lucide-react';

const RoomPhotoSlider = ({ photos, altText }) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!photos || photos.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % photos.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [photos]);

  if (!photos || photos.length === 0) {
    return <img src="https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80" alt={altText} className="w-full h-full object-cover" />;
  }

  return (
    <div className="relative w-full h-full group overflow-hidden">
      <img src={photos[current]} alt={altText} className="w-full h-full object-cover transition-opacity duration-500" />
      {photos.length > 1 && (
        <>
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrent((prev) => (prev > 0 ? prev - 1 : photos.length - 1)); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/70 hover:bg-white backdrop-blur rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow"
          >
            <ChevronLeft size={16} className="text-gray-800" />
          </button>
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrent((prev) => (prev < photos.length - 1 ? prev + 1 : 0)); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/70 hover:bg-white backdrop-blur rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow"
          >
            <ChevronRight size={16} className="text-gray-800" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {photos.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === current ? 'bg-white' : 'bg-white/50'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const HotelDetailPage = () => {
  const { hotelId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';
  const guests = searchParams.get('guests') || '1';
  const rooms = searchParams.get('rooms') || '1';

  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [checkingRoom, setCheckingRoom] = useState(null);

  useEffect(() => {
    const fetchHotel = async () => {
      try {
        const params = new URLSearchParams();
        if (checkIn) params.set('checkIn', checkIn);
        if (checkOut) params.set('checkOut', checkOut);
        if (rooms) params.set('rooms', rooms);

        const res = await api.get(`/hotels/${hotelId}?${params.toString()}`);
        setHotel(res.data.data);
      } catch (err) {
        toast.error('Failed to load hotel details');
      } finally {
        setLoading(false);
      }
    };
    fetchHotel();
  }, [hotelId, checkIn, checkOut, rooms]);

  const handleSelectRoom = async (room) => {
    if (!checkIn || !checkOut) {
      toast.error('Please select check-in and check-out dates first');
      return;
    }

    setCheckingRoom(room._id);
    try {
      const res = await api.post(`/hotels/${hotelId}/check-availability`, {
        roomId: room._id,
        checkIn,
        checkOut,
        roomsCount: parseInt(rooms) || 1,
      });

      if (res.data.available) {
        const params = new URLSearchParams({
          hotelId,
          roomId: room._id,
          checkIn,
          checkOut,
          guests,
          rooms,
        });
        navigate(`/checkout?${params.toString()}`);
      } else {
        toast.error('Sorry, this room is no longer available for the selected dates. Please choose another room.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to check availability');
    } finally {
      setCheckingRoom(null);
    }
  };

  const nights = checkIn && checkOut
    ? Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)))
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-gray-500 text-lg">Hotel not found.</p>
      </div>
    );
  }

  const photos = hotel.photos?.length > 0 ? hotel.photos : ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'];

  return (
    <div className="min-h-screen bg-background">
      {/* Photo Gallery */}
      <div className="relative h-[50vh] bg-gray-900 overflow-hidden">
        <img src={photos[selectedPhoto]} alt={hotel.hotelName} className="w-full h-full object-cover opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"></div>

        {photos.length > 1 && (
          <>
            <button onClick={() => setSelectedPhoto(p => p > 0 ? p - 1 : photos.length - 1)} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => setSelectedPhoto(p => p < photos.length - 1 ? p + 1 : 0)} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition">
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Thumbnails */}
        {photos.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {photos.slice(0, 6).map((p, i) => (
              <button key={i} onClick={() => setSelectedPhoto(i)} className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition ${selectedPhoto === i ? 'border-accent' : 'border-white/30'}`}>
                <img src={p} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Hotel Name Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                <ShieldCheck size={12} /> Verified
              </span>
              {hotel.category && <span className="bg-white/20 text-white text-xs font-semibold px-2 py-1 rounded">{hotel.category}</span>}
            </div>
            <h1 className="text-4xl font-heading font-bold text-white mb-1">{hotel.hotelName}</h1>
            <p className="text-white/80 flex items-center gap-1"><MapPin size={16} /> {hotel.address || hotel.city}{hotel.state ? `, ${hotel.state}` : ''}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Main Content */}
          <div className="flex-1 space-y-10">
            {/* Rating & Quick Info */}
            <div className="flex flex-wrap items-center gap-6">
              {hotel.avgRating && (
                <div className="flex items-center gap-2 bg-accent/10 px-4 py-2 rounded-xl">
                  <Star size={20} className="text-accent fill-accent" />
                  <span className="text-xl font-bold text-gray-900">{hotel.avgRating}</span>
                  <span className="text-gray-500 text-sm">({hotel.reviewCount} reviews)</span>
                </div>
              )}
              {hotel.starRating > 0 && (
                <div className="flex items-center gap-1">
                  {Array.from({ length: hotel.starRating }).map((_, i) => (
                    <Star key={i} size={16} className="text-accent fill-accent" />
                  ))}
                  <span className="text-sm text-gray-500 ml-1">{hotel.starRating}-Star Hotel</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Clock size={14} /> Check-in: {hotel.checkInTime} · Check-out: {hotel.checkOutTime}
              </div>
            </div>

            {/* Description */}
            {hotel.description && (
              <div>
                <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">About This Hotel</h2>
                <p className="text-gray-600 leading-relaxed">{hotel.description}</p>
              </div>
            )}

            {/* Amenities */}
            {hotel.amenities?.length > 0 && (
              <div>
                <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {hotel.amenities.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 text-gray-700 text-sm bg-gray-50 px-4 py-3 rounded-xl">
                      <Wind size={16} className="text-primary" /> {a}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Room Options */}
            <div>
              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-6">
                Available Rooms {nights > 0 && <span className="text-base font-normal text-gray-400">for {nights} night{nights > 1 ? 's' : ''}</span>}
              </h2>

              <div className="space-y-4">
                  {hotel.rooms?.map((room) => (
                    <motion.div key={room._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                      <div className="flex flex-col md:flex-row">
                        {/* Room Image */}
                        <div className="md:w-56 h-44 md:h-auto flex-shrink-0">
                          <RoomPhotoSlider photos={room.roomPhotos} altText={room.roomType} />
                        </div>

                        {/* Room Details */}
                        <div className="flex-1 p-6 flex flex-col justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{room.roomType}</h3>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                              <span className="flex items-center gap-1"><Users size={14} /> Up to {room.occupancy} guests</span>
                              {room.bedType && <span className="flex items-center gap-1"><BedDouble size={14} /> {room.bedType}</span>}
                            </div>
                            {room.amenities?.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-3">
                                {room.amenities.slice(0, 4).map((a, i) => (
                                  <span key={i} className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded">{a}</span>
                                ))}
                              </div>
                            )}
                            {!room.available && (
                              <p className="text-red-500 text-sm font-medium">Not available for selected dates</p>
                            )}
                            {room.available && (
                              <p className="text-green-600 text-xs font-medium">{room.availableCount} room{room.availableCount > 1 ? 's' : ''} left</p>
                            )}
                          </div>
                        </div>

                        {/* Price & Action */}
                        <div className="p-6 flex flex-col justify-between items-end border-t md:border-t-0 md:border-l border-gray-100 md:w-52">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-black">₹{(room.pricePerNight || room.price).toLocaleString()}</p>
                            <p className="text-xs text-gray-400">per night</p>
                            {nights > 0 && (
                              <p className="text-sm text-gray-600 mt-1 font-medium">
                                ₹{((room.pricePerNight || room.price) * nights * parseInt(rooms)).toLocaleString()} total
                              </p>
                            )}
                            {room.taxPercent > 0 && <p className="text-xs text-gray-400">+{room.taxPercent}% tax</p>}
                          </div>
                          <button
                            disabled={!room.available || checkingRoom === room._id}
                            onClick={() => handleSelectRoom(room)}
                            className={`mt-4 w-full px-6 py-3 rounded-xl font-bold text-sm transition ${
                              room.available
                                ? 'bg-green-400 text-gray-900 hover:bg-green-500 shadow-md' 
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {checkingRoom === room._id ? 'Checking...' : room.available ? 'Select Room' : 'Sold Out'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
            </div>

            {/* Nearby Places */}
            {hotel.nearbyPlaces?.length > 0 && (
              <div>
                <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">Nearby Places</h2>
                <div className="flex flex-wrap gap-3">
                  {hotel.nearbyPlaces.map((p, i) => (
                    <span key={i} className="bg-gray-50 text-gray-600 px-4 py-2 rounded-xl text-sm border border-gray-100">{p}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Policies */}
            {hotel.policies && Object.keys(hotel.policies).some(k => hotel.policies[k]) && (
              <div>
                <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">Hotel Policies</h2>
                <div className="bg-gray-50 rounded-xl p-6 space-y-3">
                  {hotel.policies.cancellation && <div><span className="font-semibold text-gray-700">Cancellation:</span> <span className="text-gray-600">{hotel.policies.cancellation}</span></div>}
                  {hotel.policies.refundRules && <div><span className="font-semibold text-gray-700">Refund Rules:</span> <span className="text-gray-600">{hotel.policies.refundRules}</span></div>}
                  {hotel.policies.childPolicy && <div><span className="font-semibold text-gray-700">Child Policy:</span> <span className="text-gray-600">{hotel.policies.childPolicy}</span></div>}
                  {hotel.policies.idProofRequired && <div><span className="font-semibold text-gray-700">ID Proof:</span> <span className="text-gray-600">{hotel.policies.idProofRequired}</span></div>}
                  {hotel.policies.petSmokingRules && <div><span className="font-semibold text-gray-700">Pet & Smoking:</span> <span className="text-gray-600">{hotel.policies.petSmokingRules}</span></div>}
                </div>
              </div>
            )}

            {/* Reviews */}
            {hotel.reviews?.length > 0 && (
              <div>
                <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">Guest Reviews</h2>
                <div className="space-y-4">
                  {hotel.reviews.map((review) => (
                    <div key={review._id} className="bg-white p-5 rounded-xl border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-bold">
                            {review.userId?.name?.charAt(0) || 'G'}
                          </div>
                          <span className="font-semibold text-gray-800 text-sm">{review.userId?.name || 'Guest'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star size={14} className="text-accent fill-accent" />
                          <span className="font-bold text-sm">{review.rating}</span>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm">{review.comment}</p>
                      <p className="text-xs text-gray-400 mt-2">{new Date(review.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sticky Sidebar */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-8">
              <h3 className="font-bold text-gray-800 text-lg mb-4">Your Stay</h3>
              <div className="mb-6 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Check-in</label>
                  <input type="date" className="w-full border border-gray-200 rounded-lg p-2 text-sm" value={checkIn} onChange={(e) => { const p = new URLSearchParams(searchParams); p.set('checkIn', e.target.value); navigate(`/hotels/${hotelId}?${p.toString()}`); }} min={new Date().toISOString().split('T')[0]} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Check-out</label>
                  <input type="date" className="w-full border border-gray-200 rounded-lg p-2 text-sm" value={checkOut} onChange={(e) => { const p = new URLSearchParams(searchParams); p.set('checkOut', e.target.value); navigate(`/hotels/${hotelId}?${p.toString()}`); }} min={checkIn || new Date().toISOString().split('T')[0]} />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Guests</label>
                    <input type="number" min="1" className="w-full border border-gray-200 rounded-lg p-2 text-sm" value={guests} onChange={(e) => { const p = new URLSearchParams(searchParams); p.set('guests', e.target.value); navigate(`/hotels/${hotelId}?${p.toString()}`); }} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Rooms</label>
                    <input type="number" min="1" className="w-full border border-gray-200 rounded-lg p-2 text-sm" value={rooms} onChange={(e) => { const p = new URLSearchParams(searchParams); p.set('rooms', e.target.value); navigate(`/hotels/${hotelId}?${p.toString()}`); }} />
                  </div>
                </div>
              </div>

              {checkIn && checkOut ? (
                <>
                  <div className="space-y-3 text-sm mb-4 border-t border-gray-100 pt-4">
                    <div className="flex justify-between"><span className="text-gray-500">Duration</span><span className="font-semibold">{nights} night{nights > 1 ? 's' : ''}</span></div>
                  </div>
                  {hotel.rooms?.some(r => r.available) && (
                    <div className="bg-primary/5 p-3 rounded-lg text-center">
                      <p className="text-sm text-gray-600">Starting from</p>
                      <p className="text-2xl font-bold text-black">
                        ₹{Math.min(...hotel.rooms.filter(r => r.available).map(r => r.pricePerNight || r.price)).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400">per night</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500 border-t border-gray-100 pt-4">Select dates to see pricing and availability.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelDetailPage;
