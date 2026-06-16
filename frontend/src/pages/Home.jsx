import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { MapPin, Calendar, Car, Star, ShieldCheck, Clock, Navigation, Users, BedDouble } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AboutUs from './info/AboutUs';
import Features from './info/Features';
import Earning from './info/Earning';
import FAQ from './info/FAQ';

const Home = () => {
  const [activeTab, setActiveTab] = useState('hotels');
  const [featuredHotels, setFeaturedHotels] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Hotel search state
  const [hotelSearch, setHotelSearch] = useState({
    destination: '',
    checkIn: '',
    checkOut: '',
    guests: 1,
    rooms: 1,
  });

  const handleHotelSearch = () => {
    if (!hotelSearch.destination.trim()) {
      toast.error('Please enter a destination');
      return;
    }
    if (!hotelSearch.checkIn) {
      toast.error('Please select a check-in date');
      return;
    }
    if (!hotelSearch.checkOut) {
      toast.error('Please select a check-out date');
      return;
    }
    if (new Date(hotelSearch.checkOut) <= new Date(hotelSearch.checkIn)) {
      toast.error('Check-out date must be after check-in date');
      return;
    }

    const params = new URLSearchParams({
      city: hotelSearch.destination,
      checkIn: hotelSearch.checkIn,
      checkOut: hotelSearch.checkOut,
      guests: hotelSearch.guests,
      rooms: hotelSearch.rooms,
    });
    navigate(`/hotels?${params.toString()}`);
  };

  React.useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await api.get('/hotels/search');
        if (res.data && res.data.data) {
          setFeaturedHotels(res.data.data.slice(0, 6));
        }
      } catch (err) {
        console.error('Failed to fetch featured hotels');
      }
    };
    fetchFeatured();
  }, []);

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-background">
      {/* Immersive Hero Section */}
      <section className="relative w-full h-[95vh] flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <img src="/images/hero.png" alt="Luxury Hotel" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-[#1B2E5C]/60 to-[#1B2E5C]/90"></div>
        </div>

        <div className="relative z-10 text-center text-white px-4 max-w-5xl mx-auto w-full pt-16">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold mb-6 drop-shadow-2xl leading-tight">
              Your Journey, <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-yellow-200">Our Passion</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-12 max-w-2xl mx-auto font-light tracking-wide">
              Seamlessly book premium hotel stays and reliable cab rides through our integrated, luxury platform.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="mx-auto max-w-5xl mt-8">
            {/* Tabs */}
            <div className="flex justify-center gap-8 mb-6">
              <button onClick={() => setActiveTab('hotels')} className={`text-lg font-bold transition-all flex items-center gap-2 pb-2 border-b-2 ${activeTab === 'hotels' ? 'border-accent text-accent' : 'border-transparent text-white/60 hover:text-white'}`}>
                <MapPin size={20} /> Hotel Stays
              </button>
              <button onClick={() => setActiveTab('cabs')} className={`text-lg font-bold transition-all flex items-center gap-2 pb-2 border-b-2 ${activeTab === 'cabs' ? 'border-accent text-accent' : 'border-transparent text-white/60 hover:text-white'}`}>
                <Car size={20} /> Cab Rides
              </button>
            </div>

            {/* Hotel Search Form */}
            {activeTab === 'hotels' ? (
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-2xl">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-white/70 text-xs font-semibold mb-1 uppercase tracking-wide">Destination</label>
                    <div className="relative">
                      <Navigation size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                      <input type="text" placeholder="City, hotel name..." value={hotelSearch.destination} onChange={(e) => setHotelSearch({ ...hotelSearch, destination: e.target.value })} className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 outline-none focus:border-accent transition" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-white/70 text-xs font-semibold mb-1 uppercase tracking-wide">Check-in</label>
                    <input type="date" min={today} value={hotelSearch.checkIn} onChange={(e) => setHotelSearch({ ...hotelSearch, checkIn: e.target.value })} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white outline-none focus:border-accent transition [color-scheme:dark]" />
                  </div>
                  <div>
                    <label className="block text-white/70 text-xs font-semibold mb-1 uppercase tracking-wide">Check-out</label>
                    <input type="date" min={hotelSearch.checkIn || today} value={hotelSearch.checkOut} onChange={(e) => setHotelSearch({ ...hotelSearch, checkOut: e.target.value })} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white outline-none focus:border-accent transition [color-scheme:dark]" />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-white/70 text-xs font-semibold mb-1 uppercase tracking-wide">Guests</label>
                      <select value={hotelSearch.guests} onChange={(e) => setHotelSearch({ ...hotelSearch, guests: e.target.value })} className="w-full px-3 py-3 bg-white/10 border border-white/20 rounded-xl text-white outline-none focus:border-accent transition [color-scheme:dark]">
                        {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n} className="text-gray-900">{n}</option>)}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-white/70 text-xs font-semibold mb-1 uppercase tracking-wide">Rooms</label>
                      <select value={hotelSearch.rooms} onChange={(e) => setHotelSearch({ ...hotelSearch, rooms: e.target.value })} className="w-full px-3 py-3 bg-white/10 border border-white/20 rounded-xl text-white outline-none focus:border-accent transition [color-scheme:dark]">
                        {[1,2,3,4,5].map(n => <option key={n} value={n} className="text-gray-900">{n}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <button onClick={handleHotelSearch} className="w-full md:w-auto mt-4 px-12 bg-accent text-primary-dark py-3 rounded-xl font-bold text-lg hover:bg-[#b59540] transition shadow-lg">
                  Search Hotels
                </button>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row gap-0 rounded-full bg-white/10 backdrop-blur-md border border-white/20 p-2 shadow-2xl">
                <div className="flex-1 relative border-b md:border-b-0 md:border-r border-white/20">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-accent"><MapPin size={18}/></div>
                  <input type="text" placeholder="Pickup Location" className="w-full pl-14 pr-6 py-4 bg-transparent border-none focus:ring-0 outline-none text-white placeholder-white/60 text-lg font-light" />
                </div>
                <div className="flex-1 relative">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/50"><Navigation size={18}/></div>
                  <input type="text" placeholder="Drop Location" className="w-full pl-14 pr-6 py-4 bg-transparent border-none focus:ring-0 outline-none text-white placeholder-white/60 text-lg font-light" />
                </div>
                <button onClick={() => navigate('/cab-booking')} className="md:w-auto px-10 bg-accent text-primary-dark py-4 rounded-full font-bold text-lg hover:bg-[#b59540] transition">
                  Book Ride
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Featured Hotels */}
      {featuredHotels.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="mb-12">
            <h2 className="text-4xl font-heading font-bold text-primary mb-4">Featured Destinations</h2>
            <p className="text-gray-500 text-lg font-light">Explore our handpicked selection of premium properties.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredHotels.map((hotel, index) => (
              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} key={hotel._id} className="bg-white rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.16)] transition-all duration-300 group flex flex-col">
                <div className="relative h-64 overflow-hidden group">
                  <img src={hotel.photos?.[0] || `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80`} alt={hotel.hotelName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  {hotel.avgRating && (
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-1 text-sm font-bold shadow-sm text-gray-900">
                      <Star size={14} className="text-accent fill-accent" /> {hotel.avgRating}
                    </div>
                  )}
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <h3 className="text-2xl font-heading font-bold text-gray-900 mb-2">{hotel.hotelName}</h3>
                  <p className="text-gray-500 text-sm mb-4 flex items-center gap-1.5"><MapPin size={16} className="text-primary" /> {hotel.city}</p>
                  {hotel.amenities?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {hotel.amenities.slice(0, 3).map((a, i) => (
                        <span key={i} className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded">{a}</span>
                      ))}
                    </div>
                  )}
                  <div className="mt-auto border-t border-gray-100 pt-4 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-gray-800 text-sm">Starts from</p>
                      <p className="text-lg font-bold text-primary">₹{hotel.startingPrice || (hotel.rooms?.[0]?.price)} <span className="text-gray-400 font-normal text-sm">/ night</span></p>
                    </div>
                    <Link to={`/hotels/${hotel._id}`} className="px-6 py-2.5 bg-accent text-primary-dark rounded-xl font-bold text-sm hover:bg-[#b59540] transition-colors">
                      View Details
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* CTA Section */}
      {!user && (
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary-dark"></div>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#C8A84E 2px, transparent 2px)', backgroundSize: '40px 40px' }}></div>
          <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6">Ready to elevate your travel?</h2>
            <p className="text-xl text-white/80 mb-10 font-light">Join thousands of satisfied travelers who trust Innovative Hotel Solution for their journeys.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/register" className="px-8 py-4 bg-accent text-primary-dark font-bold rounded-xl hover:bg-[#b59540] transition shadow-lg text-lg">Create an Account</Link>
              <Link to="/register?role=provider" className="px-8 py-4 bg-transparent border border-white/30 text-white font-bold rounded-xl hover:bg-white/10 transition text-lg">Become a Partner</Link>
            </div>
          </div>
        </section>
      )}

      <div id="about"><AboutUs /></div>
      <div id="features"><Features /></div>
      <div id="earning"><Earning /></div>
      <div id="faq"><FAQ /></div>
    </div>
  );
};

export default Home;
