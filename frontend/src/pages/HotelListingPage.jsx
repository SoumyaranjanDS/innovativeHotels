import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/axios';
import { MapPin, Star, ShieldCheck, Filter, SortAsc, Wifi, Car as CarIcon, Coffee, Dumbbell } from 'lucide-react';

const HotelListingPage = () => {
  const [searchParams] = useSearchParams();
  const city = searchParams.get('city') || '';
  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';
  const guests = searchParams.get('guests') || '1';
  const rooms = searchParams.get('rooms') || '1';

  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  useEffect(() => {
    const fetchHotels = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (city) params.set('city', city);
        if (checkIn) params.set('checkIn', checkIn);
        if (checkOut) params.set('checkOut', checkOut);
        if (guests) params.set('guests', guests);
        if (rooms) params.set('rooms', rooms);

        const res = await api.get(`/hotels/search?${params.toString()}`);
        setHotels(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch hotels', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHotels();
  }, [city, checkIn, checkOut, guests, rooms]);

  const sortedHotels = useMemo(() => {
    let filtered = [...hotels];
    if (filterCategory) {
      filtered = filtered.filter(h => h.category?.toLowerCase() === filterCategory.toLowerCase());
    }
    if (sortBy === 'price_low') {
      filtered.sort((a, b) => (a.startingPrice || 9999) - (b.startingPrice || 9999));
    } else if (sortBy === 'price_high') {
      filtered.sort((a, b) => (b.startingPrice || 0) - (a.startingPrice || 0));
    } else if (sortBy === 'rating') {
      filtered.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
    }
    return filtered;
  }, [hotels, sortBy, filterCategory]);

  const nights = checkIn && checkOut
    ? Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)))
    : 1;

  const buildDetailUrl = (hotelId) => {
    const params = new URLSearchParams();
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    if (guests) params.set('guests', guests);
    if (rooms) params.set('rooms', rooms);
    return `/hotels/${hotelId}?${params.toString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-lg">Searching hotels...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Search Summary Bar */}
      <div className="bg-[#FAF9F5] text-gray-900 py-6 pt-32 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-heading font-bold mb-2">
            Hotels in {city || 'All Locations'}
          </h1>
          <p className="text-gray-600 font-medium">
            {checkIn && checkOut && (
              <>{new Date(checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — {new Date(checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {nights} night{nights > 1 ? 's' : ''} · </>
            )}
            {guests} guest{guests > 1 ? 's' : ''} · {rooms} room{rooms > 1 ? 's' : ''} · {sortedHotels.length} result{sortedHotels.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-8">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Filter size={16} /> Filters</h3>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-600 mb-2">Sort By</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-primary focus:border-primary outline-none">
                  <option value="">Recommended</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="rating">Rating</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-600 mb-2">Category</label>
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-primary focus:border-primary outline-none">
                  <option value="">All Categories</option>
                  <option value="Budget">Budget</option>
                  <option value="Standard">Standard</option>
                  <option value="Premium">Premium</option>
                  <option value="Luxury">Luxury</option>
                  <option value="Resort">Resort</option>
                </select>
              </div>

              {sortBy || filterCategory ? (
                <button onClick={() => { setSortBy(''); setFilterCategory(''); }} className="text-sm text-primary font-semibold hover:underline">
                  Clear Filters
                </button>
              ) : null}
            </div>
          </div>

          {/* Results */}
          <div className="flex-1">
            {sortedHotels.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
                <p className="text-gray-500 text-lg mb-2">No hotels found for your search.</p>
                <p className="text-gray-400 text-sm">Try adjusting your dates or destination.</p>
                <Link to="/" className="inline-block mt-6 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-light transition">
                  Search Again
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {sortedHotels.map((hotel, index) => (
                  <motion.div key={hotel._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                    <Link to={buildDetailUrl(hotel._id)} className="block bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group">
                      <div className="flex flex-col md:flex-row">
                        {/* Image */}
                        <div className="md:w-72 h-56 md:h-auto relative overflow-hidden flex-shrink-0">
                          <img src={hotel.photos?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80'} alt={hotel.hotelName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          {hotel.avgRating && (
                            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-full flex items-center gap-1 text-sm font-bold">
                              <Star size={12} className="text-accent fill-accent" /> {hotel.avgRating}
                              <span className="text-gray-400 font-normal">({hotel.reviewCount})</span>
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 p-6 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="text-xl font-heading font-bold text-gray-900 group-hover:text-primary transition">{hotel.hotelName}</h3>
                                <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                                  <MapPin size={14} /> {hotel.address || hotel.city}{hotel.state ? `, ${hotel.state}` : ''}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 text-green-600 text-xs font-semibold bg-green-50 px-2 py-1 rounded">
                                <ShieldCheck size={14} /> Verified
                              </div>
                            </div>

                            {hotel.amenities?.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {hotel.amenities.slice(0, 5).map((a, i) => (
                                  <span key={i} className="text-xs bg-gray-50 text-gray-600 px-2.5 py-1 rounded-full border border-gray-100">{a}</span>
                                ))}
                                {hotel.amenities.length > 5 && (
                                  <span className="text-xs text-primary font-medium">+{hotel.amenities.length - 5} more</span>
                                )}
                              </div>
                            )}

                            {hotel.cancellationPolicy && (
                              <p className="text-xs text-green-600 mt-3 font-medium">{hotel.cancellationPolicy}</p>
                            )}
                          </div>

                          <div className="flex items-end justify-between mt-4 pt-4 border-t border-gray-50">
                            <div>
                              {hotel.category && <span className="text-xs text-gray-400 uppercase tracking-wide">{hotel.category}</span>}
                            </div>
                            <div className="text-right">
                              {hotel.startingPrice ? (
                                <>
                                  <p className="text-2xl font-bold text-primary">₹{hotel.startingPrice.toLocaleString()}</p>
                                  <p className="text-xs text-gray-400">per night · {nights} night{nights > 1 ? 's' : ''}</p>
                                </>
                              ) : (
                                <p className="text-sm text-gray-400">Price on request</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelListingPage;
