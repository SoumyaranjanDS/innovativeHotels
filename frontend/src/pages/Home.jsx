import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { MapPin, Calendar, Car, Star, ShieldCheck, Clock, Navigation } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AboutUs from './info/AboutUs';
import Features from './info/Features';
import Earning from './info/Earning';
import FAQ from './info/FAQ';

const Home = () => {
  const [activeTab, setActiveTab] = useState('hotels');
  const [hotels, setHotels] = useState([]);
  const [featuredHotels, setFeaturedHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const searchHotels = async () => {
    setLoading(true);
    try {
      const res = await api.get('/hotels/search');
      setHotels(res.data.data);
    } catch (err) {
      toast.error('Failed to search hotels');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    // Fetch some hotels on load to show as featured
    const fetchFeatured = async () => {
      try {
        const res = await api.get('/hotels/search');
        if (res.data && res.data.data) {
          setFeaturedHotels(res.data.data.slice(0, 6)); // Top 8
        }
      } catch (err) {
        console.error('Failed to fetch featured hotels');
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div className="bg-background">
      {/* Immersive Hero Section */}
      <section className="relative w-full h-[95vh] flex items-center justify-center">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero.png"
            alt="Luxury Hotel"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-[#1B2E5C]/60 to-[#1B2E5C]/90"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center text-white px-4 max-w-5xl mx-auto w-full pt-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
          
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold mb-6 drop-shadow-2xl leading-tight">
              Your Journey, <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-yellow-200">
                Our Passion
              </span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-12 max-w-2xl mx-auto font-light tracking-wide">
              Seamlessly book premium hotel stays and reliable cab rides through our integrated, luxury platform.
            </p>
          </motion.div>

          {/* Integrated Search Bar - NO BOX */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="mx-auto max-w-4xl mt-12"
          >
            {/* Tabs */}
            <div className="flex justify-center gap-8 mb-6">
              <button
                onClick={() => setActiveTab('hotels')}
                className={`text-lg font-bold transition-all flex items-center gap-2 pb-2 border-b-2 ${activeTab === 'hotels' ? 'border-accent text-accent' : 'border-transparent text-white/60 hover:text-white'}`}
              >
                <MapPin size={20} />
                Hotel Stays
              </button>
              <button
                onClick={() => setActiveTab('cabs')}
                className={`text-lg font-bold transition-all flex items-center gap-2 pb-2 border-b-2 ${activeTab === 'cabs' ? 'border-accent text-accent' : 'border-transparent text-white/60 hover:text-white'}`}
              >
                <Car size={20} />
                Cab Rides
              </button>
            </div>

            {/* Form Area - integrated horizontal bar */}
            <div className="flex flex-col md:flex-row gap-0 rounded-full bg-white/10 backdrop-blur-md border border-white/20 p-2 shadow-2xl">
              {activeTab === 'hotels' ? (
                <>
                  <div className="flex-1 relative border-b md:border-b-0 md:border-r border-white/20">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/50"><Navigation size={18}/></div>
                    <input type="text" placeholder="Where are you going?" className="w-full pl-14 pr-6 py-4 bg-transparent border-none focus:ring-0 outline-none text-white placeholder-white/60 text-lg font-light" />
                  </div>
                  <div className="flex-1 relative">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/50"><Calendar size={18}/></div>
                    <input type="text" placeholder="Check-in — Check-out" onFocus={(e) => e.target.type = 'date'} onBlur={(e) => {if(!e.target.value) e.target.type = 'text'}} className="w-full pl-14 pr-6 py-4 bg-transparent border-none focus:ring-0 outline-none text-white placeholder-white/60 text-lg font-light [color-scheme:dark]" />
                  </div>
                  <button onClick={searchHotels} disabled={loading} className="md:w-auto px-10 bg-accent text-primary-dark py-4 rounded-full font-bold text-lg hover:bg-[#b59540] transition">
                    {loading ? 'Searching...' : 'Explore'}
                  </button>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Search Results */}
      {activeTab === 'hotels' && hotels.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-b border-gray-100">
          <div className="mb-12">
            <h2 className="text-3xl font-heading font-bold text-primary">Search Results</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {hotels.map((hotel, index) => (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                key={hotel._id} 
                className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 transition-all duration-300 group"
              >
                <div className="h-64 bg-gray-200 relative overflow-hidden">
                   <img src={hotel.photos?.[0] || `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80`} alt={hotel.hotelName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                   <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-1 text-sm font-bold shadow-sm">
                     <Star size={14} className="text-accent fill-accent" /> 4.8
                   </div>
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-heading font-bold text-gray-900 mb-2">{hotel.hotelName}</h3>
                  <p className="text-gray-500 text-sm mb-6 flex items-center gap-1.5"><MapPin size={16} className="text-primary" /> {hotel.city}</p>

                  {hotel.rooms && hotel.rooms.length > 0 ? (
                    <div className="space-y-4">
                      {hotel.rooms.map((room, i) => (
                        <div key={room._id} className={`${i !== 0 ? 'border-t border-gray-100 pt-4' : ''} flex justify-between items-center`}>
                          <div>
                            <p className="font-bold text-gray-800">{room.roomType}</p>
                            <p className="text-sm font-medium text-primary">₹{room.price} <span className="text-gray-400 font-normal">/ night</span></p>
                          </div>
                          <Link
                            to={`/checkout?hotelId=${hotel._id}&roomId=${room._id}`}
                            className="px-6 py-2.5 bg-gray-50 text-primary rounded-xl font-bold text-sm hover:bg-primary hover:text-white transition-colors"
                          >
                            Reserve
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-red-500 font-medium bg-red-50 p-3 rounded-lg">No rooms currently available</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Hotels (Card Format as requested) */}
      {featuredHotels.length > 0 && hotels.length === 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="mb-12">
            <h2 className="text-4xl font-heading font-bold text-primary mb-4">Featured Destinations</h2>
            <p className="text-gray-500 text-lg font-light">Explore our handpicked selection of premium properties.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredHotels.map((hotel, index) => (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                key={hotel._id} 
                className="bg-white rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.16)] transition-all duration-300 group flex flex-col"
              >
                <div className="h-64 relative overflow-hidden">
                   <img src={hotel.photos?.[0] || `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80`} alt={hotel.hotelName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                   <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-1 text-sm font-bold shadow-sm text-gray-900">
                     <Star size={14} className="text-accent fill-accent" /> 4.8
                   </div>
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <h3 className="text-2xl font-heading font-bold text-gray-900 mb-2">{hotel.hotelName}</h3>
                  <p className="text-gray-500 text-sm mb-6 flex items-center gap-1.5"><MapPin size={16} className="text-primary" /> {hotel.city}</p>

                  <div className="mt-auto">
                    {hotel.rooms && hotel.rooms.length > 0 ? (
                      <div className="space-y-4">
                        {hotel.rooms.slice(0, 1).map((room, i) => (
                          <div key={room._id} className="flex justify-between items-center border-t border-gray-100 pt-4">
                            <div>
                              <p className="font-bold text-gray-800 text-sm">Starts from</p>
                              <p className="text-lg font-bold text-primary">₹{room.price} <span className="text-gray-400 font-normal text-sm">/ night</span></p>
                            </div>
                            <Link
                              to={`/checkout?hotelId=${hotel._id}&roomId=${room._id}`}
                              className="px-6 py-2.5 bg-accent text-primary-dark rounded-xl font-bold text-sm hover:bg-[#b59540] transition-colors"
                            >
                              Reserve
                            </Link>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-red-500 font-medium border-t border-gray-100 pt-4">No rooms available</p>
                    )}
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
              <Link to="/register" className="px-8 py-4 bg-accent text-primary-dark font-bold rounded-xl hover:bg-[#b59540] transition shadow-lg text-lg">
                Create an Account
              </Link>
              <Link to="/register?role=provider" className="px-8 py-4 bg-transparent border border-white/30 text-white font-bold rounded-xl hover:bg-white/10 transition text-lg">
                Become a Partner
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Render Info Pages as Sections */}
      <div id="about"><AboutUs /></div>
      <div id="features"><Features /></div>
      <div id="earning"><Earning /></div>
      <div id="faq"><FAQ /></div>
    </div>
  );
};

export default Home;
