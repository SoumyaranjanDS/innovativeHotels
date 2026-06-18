import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { MapPin, Navigation, ArrowRight, ShieldCheck, Clock, Users, Building2, CheckCircle2, ChevronDown, Phone, Mail, Car, Search, CalendarCheck, Key, Crown, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLoadScript, Autocomplete } from '@react-google-maps/api';

const libraries = ['places'];

// Helper Accordion component for FAQ
const AccordionItem = ({ question, answer, isOpen, onClick }) => {
  return (
    <div className="border border-gray-200 bg-white rounded-2xl mb-4 overflow-hidden shadow-sm transition-all">
      <button 
        className="w-full flex justify-between items-center p-6 text-left"
        onClick={onClick}
      >
        <span className="font-heading text-xl text-[#2C2C2C]">{question}</span>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isOpen ? 'bg-accent text-white' : 'bg-[#F3F1EB] text-gray-500'}`}>
          <ChevronDown size={16} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 pt-0 text-gray-500 leading-relaxed font-body">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TestimonialSection = () => {
  const testimonials = [
    {
      name: "Honey Atalkar",
      role: "Frequent Traveler",
      rating: "4.2",
      text: "INNO is the best place to book everything online! The app explains every step beautifully and accurately.",
      img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&q=80"
    },
    {
      name: "Parth Gupta",
      role: "Business Executive",
      rating: "4.7",
      text: "Booking at INNO has been an amazing experience! The mentors explain everything beautifully.",
      img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&q=80"
    },
    {
      name: "Mohd Siraj",
      role: "Web Developer",
      rating: "4.1",
      text: "I had a great experience booking cabs. The team is highly supportive and knowledgeable.",
      img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&q=80"
    },
    {
      name: "Eleanor Wright",
      role: "Frequent Traveler",
      rating: "4.9",
      text: "The most seamless experience I've ever had. Booking my penthouse and the airport transfer in one go was absolute magic.",
      img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&q=80"
    },
    {
      name: "Marcus Thorne",
      role: "Global Nomad",
      rating: "4.8",
      text: "I travel 200 days a year. INNO’s predictive cab tracking and handpicked luxury stays have fundamentally changed my routine.",
      img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&q=80"
    }
  ];

  const row1 = [...testimonials, ...testimonials, ...testimonials];
  const row2 = [...[...testimonials].reverse(), ...[...testimonials].reverse(), ...[...testimonials].reverse()];

  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} size={12} className={i < Math.floor(parseFloat(rating)) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"} />
    ));
  };

  return (
    <section className="bg-[#1E2418] py-24 overflow-hidden border-y border-white/5">
      <style>
        {`
          @keyframes scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(calc(-33.333% - 0.666rem)); }
          }
          @keyframes scroll-reverse {
            0% { transform: translateX(calc(-33.333% - 0.666rem)); }
            100% { transform: translateX(0); }
          }
          .animate-scroll {
            animation: scroll 30s linear infinite;
          }
          .animate-scroll-reverse {
            animation: scroll-reverse 30s linear infinite;
          }
          .pause-on-hover:hover {
            animation-play-state: paused;
          }
        `}
      </style>
      
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 mb-16 text-center">
        <h2 className="text-4xl md:text-5xl font-heading text-white mb-4">What Our Clients Say</h2>
        <p className="font-script text-2xl text-[#8A9A74]">Join thousands of happy travelers.</p>
      </div>

      <div 
        className="flex flex-col gap-8 relative w-full"
        style={{ WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)', maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}
      >
        {/* Top Row - Scrolls Left */}
        <div className="flex gap-8 w-max animate-scroll pause-on-hover px-4">
          {row1.map((t, i) => (
            <div key={i} className="w-[320px] md:w-[400px] shrink-0 bg-[#2C3524] border border-white/10 shadow-sm rounded-2xl p-6 hover:bg-[#3A452F] transition-colors">
              <div className="flex items-center gap-4 mb-4">
                <img src={t.img} alt={t.name} className="w-12 h-12 rounded-full object-cover border border-white/20" />
                <div>
                  <h4 className="text-white text-sm font-semibold">{t.name}</h4>
                  <span className="text-[#F3F1EB]/80 text-xs">{t.role}</span>
                </div>
              </div>
              <div className="h-px bg-white/20 w-full mb-4"></div>
              <div className="flex items-center gap-1 mb-3">
                <span className="text-white text-xs mr-2 font-medium">{t.rating}</span>
                <div className="flex gap-1">{renderStars(t.rating)}</div>
              </div>
              <p className="text-white/90 text-sm leading-relaxed line-clamp-2">{t.text}</p>
            </div>
          ))}
        </div>

        {/* Bottom Row - Scrolls Right */}
        <div className="flex gap-8 w-max animate-scroll-reverse pause-on-hover px-4">
          {row2.map((t, i) => (
            <div key={i} className="w-[320px] md:w-[400px] shrink-0 bg-[#2C3524] border border-white/10 shadow-sm rounded-2xl p-6 hover:bg-[#3A452F] transition-colors">
              <div className="flex items-center gap-4 mb-4">
                <img src={t.img} alt={t.name} className="w-12 h-12 rounded-full object-cover border border-white/20" />
                <div>
                  <h4 className="text-white text-sm font-semibold">{t.name}</h4>
                  <span className="text-[#F3F1EB]/80 text-xs">{t.role}</span>
                </div>
              </div>
              <div className="h-px bg-white/20 w-full mb-4"></div>
              <div className="flex items-center gap-1 mb-3">
                <span className="text-white text-xs mr-2 font-medium">{t.rating}</span>
                <div className="flex gap-1">{renderStars(t.rating)}</div>
              </div>
              <p className="text-white/90 text-sm leading-relaxed line-clamp-2">{t.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Home = () => {
  const [activeFaq, setActiveFaq] = useState(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [activeTab, setActiveTab] = useState('hotels');
  const [featuredHotels, setFeaturedHotels] = useState([]);
  const navigate = useNavigate();

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries
  });
  
  const autocompleteRef = useRef(null);
  const cabPickupRef = useRef(null);
  const cabDropRef = useRef(null);

  const [hotelSearch, setHotelSearch] = useState({ destination: '', checkIn: '', checkOut: '', guests: 1, rooms: 1 });
  const [cabSearch, setCabSearch] = useState({ pickup: null, drop: null, vehicleType: 'Mini', cabSourcePreference: 'ANY' });

  const handleHotelSearch = () => {
    if (!hotelSearch.destination.trim()) { toast.error('Please enter a destination'); return; }
    if (!hotelSearch.checkIn || !hotelSearch.checkOut) { toast.error('Please select both dates'); return; }
    const params = new URLSearchParams(hotelSearch);
    navigate(`/hotels?${params.toString()}`);
  };

  const handlePlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      if (place && place.formatted_address) {
        setHotelSearch({ ...hotelSearch, destination: place.name || place.formatted_address });
      }
    }
  };

  const handleCabPlaceChanged = (ref, field) => {
    if (ref.current !== null) {
      const place = ref.current.getPlace();
      if (place && place.geometry) {
        setCabSearch(prev => ({ ...prev, [field]: { address: place.formatted_address, placeId: place.place_id, lat: place.geometry.location.lat(), lng: place.geometry.location.lng() } }));
      }
    }
  };

  const handleCabSearchSubmit = () => {
    if (!cabSearch.pickup || !cabSearch.drop) { toast.error('Select both locations'); return; }
    navigate('/cab-booking', { state: cabSearch });
  };

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await api.get('/hotels/search');
        if (res.data && res.data.data) {
          setFeaturedHotels(res.data.data.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to fetch featured hotels');
      }
    };
    fetchFeatured();
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const faqs = [
    { q: "How do I make a reservation?", a: "You can easily book a hotel or cab through our online portal. Simply use the search form, select your desired dates or route, and complete the payment securely." },
    { q: "What is your cancellation policy?", a: "We offer flexible cancellation policies. For most bookings, you can cancel up to 24 hours in advance for a full refund." },
    { q: "Are the cabs driven by professionals?", a: "Absolutely. All our partner drivers undergo rigorous background checks and professional training to ensure your safety and comfort." }
  ];

  return (
    <div className="font-body overflow-x-hidden selection:bg-accent selection:text-white bg-[#FAF9F5] text-[#2C2C2C]">
      
      {/* ================= HERO SECTION ================= */}
      <section className="relative w-full min-h-screen pt-[45px] lg:pt-28 pb-12 flex items-center justify-center">
        <div className="max-w-[1400px] w-full mx-auto px-6 lg:px-12 flex flex-col lg:flex-row items-center gap-12 relative z-10 mt-[-65px]">
          
          {/* Left Text */}
          <div className="w-full lg:w-[45%] z-20 lg:pr-10 pt-6 pb-12 lg:py-20">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
              className="text-5xl md:text-6xl lg:text-[76px] font-heading font-normal text-[#2C2C2C] leading-[1.05] mb-4"
            >
              Modern stays<br />
              <span className="text-4xl md:text-5xl lg:text-[56px]">and premium rides</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
              className="font-script text-3xl text-[#5A6A44] mb-8"
            >
              for life and inspiration...
            </motion.p>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden md:block text-gray-500 text-sm md:text-base font-light mb-12 max-w-md leading-relaxed"
            >
              We provide reliable and beautiful spaces with an individual approach and attention to every detail of your journey.
            </motion.p>

            <motion.button 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}
              onClick={() => setShowSearchModal(true)}
              className="group flex items-center bg-[#8A9A74] hover:bg-[#788863] text-white rounded-full pl-6 pr-2 py-2 font-medium text-sm transition-colors mb-16 shadow-lg shadow-[#8A9A74]/30"
            >
              Check Availability
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center ml-4 text-[#8A9A74] group-hover:bg-[#F3F1EB] transition-colors">
                <ArrowRight size={16} />
              </div>
            </motion.button>
            
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 1 }}
              className="flex items-center gap-4"
            >
              <div className="flex -space-x-3">
                <img src="https://i.pravatar.cc/100?img=1" alt="User" className="w-10 h-10 rounded-full border-2 border-white" />
                <img src="https://i.pravatar.cc/100?img=2" alt="User" className="w-10 h-10 rounded-full border-2 border-white" />
                <img src="https://i.pravatar.cc/100?img=3" alt="User" className="w-10 h-10 rounded-full border-2 border-white" />
              </div>
              <div className="text-xs text-gray-500 font-medium">
                Over <strong className="text-[#2C2C2C]">120 families</strong><br/>already booked with INNO
              </div>
            </motion.div>
          </div>

          {/* Right Image Scrapbook (Design 1) - Hidden on Mobile */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
            className="hidden lg:block w-full lg:w-[55%] relative z-20 h-[500px] xl:h-[600px] mt-8 lg:mt-0"
          >
            {/* Main large image */}
            <motion.div 
              initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.2 }}
              className="absolute right-0 xl:right-4 top-0 w-[320px] xl:w-[400px] h-[420px] xl:h-[540px] rounded-[30px] xl:rounded-[40px] overflow-hidden shadow-2xl shadow-[#8A9A74]/20 border-[8px] xl:border-[10px] border-white z-10"
            >
              <img src="/images/hero1.png" alt="Luxury Hotel" className="w-full h-full object-cover object-center" />
            </motion.div>
            
            {/* Secondary offset image */}
            <motion.div 
              initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.4 }}
              className="absolute left-4 xl:left-8 bottom-0 xl:bottom-8 w-[220px] xl:w-[280px] h-[280px] xl:h-[360px] rounded-[24px] xl:rounded-[30px] overflow-hidden shadow-2xl shadow-[#8A9A74]/15 border-[6px] xl:border-[8px] border-white z-20"
            >
              <img src="/images/hero2.png" alt="Premium Cab" className="w-full h-full object-cover object-center" />
            </motion.div>

            {/* Small detail image */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8, delay: 0.6 }}
              className="absolute right-16 xl:right-28 -bottom-4 xl:-bottom-2 w-[140px] xl:w-[180px] h-[140px] xl:h-[180px] rounded-[20px] xl:rounded-[24px] overflow-hidden shadow-xl shadow-gray-200 border-[4px] xl:border-[6px] border-white z-30"
            >
              <img src="/images/hero3.png" alt="Details" className="w-full h-full object-cover object-center" />
            </motion.div>
          </motion.div>

        </div>
      </section>

      {/* ================= WHY CHOOSE US (ABOUT US) ================= */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-12 py-32">
        <div className="flex flex-col lg:flex-row gap-16">
          
          {/* Left Intro */}
          <div className="w-full lg:w-[35%] flex flex-col justify-center">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400">Why INNO</span>
              <div className="h-px w-12 bg-gray-300"></div>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-heading text-[#2C2C2C] leading-tight mb-6">
              We build experiences you want to return to
            </h2>
            
            <p className="font-script text-2xl text-[#8A9A74] mb-8">
              comfort, style, and complete peace of mind
            </p>

            <p className="text-gray-500 text-sm leading-relaxed mb-10">
              We combine modern hospitality architecture, proven booking systems, and precise technologies so that every trip is beautiful, reliable, and comfortable for your life.
            </p>

            <div className="flex items-center gap-6">
              <Link to="/about" className="bg-[#8A9A74] hover:bg-[#788863] text-white rounded-full px-6 py-3 font-medium text-sm transition-colors shadow-md flex items-center gap-3">
                About company <ArrowRight size={14} />
              </Link>
            </div>

            <div className="mt-16 bg-[#F3F1EB] rounded-2xl p-6 flex items-center gap-4 max-w-sm">
              <div className="text-[#8A9A74]">
                <ShieldCheck size={28} />
              </div>
              <div>
                <h4 className="font-bold text-[#2C2C2C] text-sm">Verified Partners</h4>
                <p className="text-xs text-gray-500 mt-1">Safe for you and your family</p>
              </div>
            </div>
          </div>

          {/* Right Grid */}
          <div className="w-full lg:w-[65%] grid grid-cols-2 gap-4 md:gap-6 mt-8 lg:mt-0">
            {[
              { title: "Individual approach", desc: "We curate stays and rides tailored to your lifestyle and specific requirements.", img: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&q=80" },
              { title: "Fixed deadlines", desc: "Clear booking plans and transparent pricing without unexpected delays.", img: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500&q=80" },
              { title: "Quality control", desc: "Technical supervision at every stage and multi-stage quality checks.", img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80" },
              { title: "Energy efficient", desc: "Modern premium fleet reduces fuel consumption and increases comfort.", img: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=500&q=80" }
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-[#F3F1EB] rounded-2xl md:rounded-3xl overflow-hidden flex flex-col h-56 md:h-72 group relative">
                <div className="p-4 md:p-8 pb-2 md:pb-4 flex-1">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-lg md:rounded-xl shadow-sm flex items-center justify-center text-[#8A9A74] mb-3 md:mb-4 shrink-0">
                    <CheckCircle2 size={16} className="hidden md:block" />
                    <CheckCircle2 size={14} className="block md:hidden" />
                  </div>
                  <h3 className="font-bold text-[#2C2C2C] text-sm md:text-lg mb-1 md:mb-2 leading-tight">{item.title}</h3>
                  <p className="text-[10px] md:text-xs text-gray-500 leading-relaxed line-clamp-3 md:line-clamp-none">{item.desc}</p>
                </div>
                <div className="h-16 md:h-24 w-full relative overflow-hidden mt-auto">
                  <img src={item.img} alt={item.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#F3F1EB]/10 to-[#F3F1EB]"></div>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* ================= PROJECTS (FEATURED HOTELS) ================= */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-12 py-20 border-t border-gray-200/60">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400">Our Projects</span>
              <div className="h-px w-12 bg-gray-300"></div>
            </div>
            <h2 className="text-4xl md:text-5xl font-heading text-[#2C2C2C] leading-tight">
              Hotels brought <br/>to life
            </h2>
          </div>
          <Link to="/hotels" className="text-sm font-medium text-gray-500 hover:text-[#8A9A74] transition-colors flex items-center gap-2 group">
            All projects <div className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center group-hover:border-[#8A9A74] transition-colors"><ArrowRight size={14} /></div>
          </Link>
        </div>

        {featuredHotels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredHotels.map((hotel, index) => (
              <motion.div 
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} 
                key={hotel._id} 
                className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 group flex flex-col"
              >
                <div className="relative h-64 overflow-hidden rounded-t-3xl rounded-b-xl m-2">
                  <img src={hotel.photos?.[0] || `https://images.unsplash.com/photo-1566073771259-6a8506099945`} alt={hotel.hotelName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                  <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-[#2C2C2C] flex items-center gap-2">
                    <Building2 size={12} className="text-[#8A9A74]"/> 120m²
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-heading font-medium text-[#2C2C2C] mb-2">{hotel.hotelName}</h3>
                  <p className="text-sm text-gray-500 font-light leading-relaxed mb-6">
                    Spacious rooms with panoramic windows and terraces for a large family.
                  </p>
                  
                  <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4">
                    <span className="text-gray-400 text-sm">from <strong className="text-[#2C2C2C]">₹{hotel.startingPrice || 4200}</strong></span>
                    <Link to={`/hotels/${hotel._id}`} className="text-xs font-medium text-gray-500 hover:text-[#8A9A74] transition-colors flex items-center gap-2">
                      Details <ArrowRight size={14} className="text-[#8A9A74]" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 font-light">Loading premium destinations...</p>
        )}
        
        {/* Decorative pagination dots */}
        <div className="flex justify-center items-center gap-2 mt-10">
          <div className="w-2.5 h-2.5 bg-[#8A9A74] rounded-full"></div>
          <div className="w-2.5 h-2.5 bg-gray-300 rounded-full"></div>
          <div className="w-2.5 h-2.5 bg-gray-300 rounded-full"></div>
        </div>
      </section>

      {/* ================= HOW WE BUILD (FEATURES/PROCESS) ================= */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-12 py-24 border-t border-gray-200/60">
        <div className="flex flex-col md:flex-row items-center gap-12 mb-16">
          <div className="w-full lg:w-[30%]">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400">How we work</span>
              <div className="h-px w-12 bg-gray-300"></div>
            </div>
            <h2 className="text-4xl font-heading text-[#2C2C2C] leading-tight">
              Transparent process <br/>from idea to stay
            </h2>
            <p className="font-script text-2xl text-[#8A9A74] mt-4">smooth and hassle-free</p>
          </div>

          <div className="w-full lg:w-[70%] flex flex-col md:flex-row justify-between gap-6 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-10 left-12 right-12 h-px bg-gray-200 z-0"></div>
            
            {[
              { num: "01", icon: Search, title: "Consultation", desc: "Discussing your wishes, budget and features." },
              { num: "02", icon: Navigation, title: "Designing", desc: "Creating an individual route and coordinating details." },
              { num: "03", icon: CalendarCheck, title: "Booking", desc: "Securing reservations exactly on plan with deadlines." },
              { num: "04", icon: Key, title: "Arrival", desc: "Final check and handing over the room keys." }
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center relative z-10 w-full">
                <div className="w-20 h-20 bg-[#F3F1EB] rounded-3xl flex flex-col items-center justify-center mb-6 shadow-sm border border-white">
                  <span className="text-sm font-heading text-[#2C2C2C] font-bold mb-1">{step.num}</span>
                  <div className="w-6 h-6 bg-[#8A9A74] rounded-lg flex items-center justify-center text-white shadow-sm">
                    <step.icon size={12} />
                  </div>
                </div>
                <h4 className="font-bold text-[#2C2C2C] text-sm mb-2">{step.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed max-w-[150px]">{step.desc}</p>
                {i < 3 && <ArrowRight size={16} className="text-gray-300 md:hidden mt-4" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      <TestimonialSection />

      {/* ================= FAQ SECTION ================= */}
      <section className="max-w-4xl mx-auto px-6 lg:px-12 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-heading text-[#2C2C2C] mb-4">Frequently Asked Questions</h2>
          <p className="font-script text-2xl text-[#8A9A74]">everything you need to know</p>
        </div>
        <div>
          {faqs.map((faq, i) => (
            <AccordionItem 
              key={i} 
              question={faq.q} 
              answer={faq.a} 
              isOpen={activeFaq === i} 
              onClick={() => setActiveFaq(activeFaq === i ? null : i)} 
            />
          ))}
        </div>
      </section>

      {/* ================= FOOTER CTA ================= */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-12 pb-32">
        <div className="relative w-full rounded-3xl overflow-hidden bg-[#F3F1EB] flex flex-col lg:flex-row min-h-[400px]">
          
          {/* Background Image spanning the right half */}
          <div className="absolute inset-0 w-full h-full z-0">
             <div className="w-full lg:w-1/2 h-full absolute right-0">
               <img src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80" alt="Lounge" className="w-full h-full object-cover" />
             </div>
             <div className="absolute inset-0 bg-gradient-to-r from-[#F3F1EB] via-[#F3F1EB]/95 lg:via-[#F3F1EB] lg:to-transparent"></div>
          </div>

          <div className="relative z-10 w-full flex flex-col lg:flex-row justify-between p-12 lg:p-20">
            {/* Left Content */}
            <div className="w-full lg:w-1/2 max-w-md">
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400 mb-4 block">Ready to start?</span>
              <h2 className="text-4xl md:text-5xl font-heading text-[#2C2C2C] leading-tight mb-6">
                Let's plan your<br/>ideal journey
              </h2>
              <p className="font-script text-2xl text-[#8A9A74] mb-8">memories wait for you</p>
              
              <p className="text-gray-500 text-sm leading-relaxed mb-10">
                Leave a request — we will contact you, tell you about the possibilities and select the best solution.
              </p>
              
              <button 
                onClick={() => setShowSearchModal(true)}
                className="bg-[#8A9A74] hover:bg-[#788863] text-white rounded-full px-8 py-4 font-medium text-sm transition-colors shadow-lg flex items-center gap-3 w-max"
              >
                Get consultation <ArrowRight size={16} />
              </button>
            </div>

            {/* Right Contact Cards */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-end gap-4 mt-12 lg:mt-0">
               <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-6 w-full max-w-sm">
                 <div className="w-12 h-12 bg-[#F3F1EB] rounded-full flex items-center justify-center text-[#8A9A74]">
                   <Phone size={20} />
                 </div>
                 <div>
                   <h4 className="font-bold text-[#2C2C2C] text-lg">+7 (495) 123-45-67</h4>
                   <p className="text-xs text-gray-500">daily from 9:00 to 20:00</p>
                 </div>
               </div>

               <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-6 w-full max-w-sm">
                 <div className="w-12 h-12 bg-[#F3F1EB] rounded-full flex items-center justify-center text-[#8A9A74]">
                   <Mail size={20} />
                 </div>
                 <div>
                   <h4 className="font-bold text-[#2C2C2C] text-lg">info@inno.com</h4>
                   <p className="text-xs text-gray-500">reply within an hour</p>
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* Footer Links Mini */}
        <div className="flex flex-col md:flex-row justify-between items-center mt-12 text-xs text-gray-400">
           <div className="flex items-center gap-2 font-heading text-lg text-[#2C2C2C] mb-4 md:mb-0">
             <Crown className="text-[#8A9A74]" size={20} /> INNO
           </div>
           <div className="flex gap-8 mb-4 md:mb-0">
             <Link to="/about" className="hover:text-[#8A9A74]">About</Link>
             <Link to="/features" className="hover:text-[#8A9A74]">Features</Link>
             <Link to="/faq" className="hover:text-[#8A9A74]">FAQ</Link>
             <Link to="/contact" className="hover:text-[#8A9A74]">Contacts</Link>
           </div>
           <div>Privacy Policy</div>
        </div>
      </section>

      {/* ================= SEARCH MODAL (Booking) ================= */}
      <AnimatePresence>
        {showSearchModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#2C2C2C]/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-4xl p-10 relative shadow-2xl rounded-[40px] overflow-hidden"
            >
              <button onClick={() => setShowSearchModal(false)} className="absolute top-6 right-6 w-10 h-10 bg-[#F3F1EB] rounded-full flex items-center justify-center text-gray-500 hover:text-[#2C2C2C] transition-colors">
                <X size={20} />
              </button>

              <div className="text-center mb-8">
                <h2 className="text-3xl font-heading text-[#2C2C2C] mb-2">Start Your Journey</h2>
                <p className="font-script text-xl text-[#8A9A74]">select your preferences</p>
              </div>

              {/* Tabs */}
              <div className="flex justify-center gap-8 mb-10 border-b border-gray-100 pb-4">
                <button onClick={() => setActiveTab('hotels')} className={`text-sm font-bold transition-all relative px-4 ${activeTab === 'hotels' ? 'text-[#8A9A74]' : 'text-gray-400 hover:text-gray-600'}`}>
                  Book A Stay
                  {activeTab === 'hotels' && <motion.div layoutId="searchTab" className="absolute -bottom-[17px] left-0 right-0 h-0.5 bg-[#8A9A74]" />}
                </button>
                <button onClick={() => setActiveTab('cabs')} className={`text-sm font-bold transition-all relative px-4 ${activeTab === 'cabs' ? 'text-[#8A9A74]' : 'text-gray-400 hover:text-gray-600'}`}>
                  Book A Ride
                  {activeTab === 'cabs' && <motion.div layoutId="searchTab" className="absolute -bottom-[17px] left-0 right-0 h-0.5 bg-[#8A9A74]" />}
                </button>
              </div>

              {/* Forms */}
              <div className="mt-8 px-4">
                {activeTab === 'hotels' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-500 mb-2">Destination</label>
                      <div className="relative bg-[#F3F1EB] rounded-2xl px-4 py-3 flex items-center focus-within:ring-2 ring-[#8A9A74]/30 transition-all">
                        <MapPin size={18} className="text-[#8A9A74] mr-3" />
                        {isLoaded ? (
                          <Autocomplete onLoad={(auto) => (autocompleteRef.current = auto)} onPlaceChanged={handlePlaceChanged} options={{ types: ['(cities)'] }}>
                            <input type="text" placeholder="City or Hotel Name" value={hotelSearch.destination} onChange={(e) => setHotelSearch({ ...hotelSearch, destination: e.target.value })} className="w-full bg-transparent text-[#2C2C2C] placeholder-gray-400 outline-none font-medium" />
                          </Autocomplete>
                        ) : (
                          <input type="text" placeholder="Loading..." disabled className="w-full bg-transparent text-[#2C2C2C] placeholder-gray-400 outline-none font-medium" />
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2">Check-in</label>
                      <input type="date" min={today} value={hotelSearch.checkIn} onChange={(e) => setHotelSearch({ ...hotelSearch, checkIn: e.target.value })} className="w-full bg-[#F3F1EB] rounded-2xl px-4 py-3 text-[#2C2C2C] outline-none font-medium focus:ring-2 ring-[#8A9A74]/30 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2">Check-out</label>
                      <input type="date" min={hotelSearch.checkIn || today} value={hotelSearch.checkOut} onChange={(e) => setHotelSearch({ ...hotelSearch, checkOut: e.target.value })} className="w-full bg-[#F3F1EB] rounded-2xl px-4 py-3 text-[#2C2C2C] outline-none font-medium focus:ring-2 ring-[#8A9A74]/30 transition-all" />
                    </div>
                    <div className="md:col-span-2 flex justify-center mt-6">
                      <button onClick={handleHotelSearch} className="px-10 py-4 bg-[#8A9A74] hover:bg-[#788863] text-white rounded-full font-bold shadow-lg shadow-[#8A9A74]/30 transition-colors flex items-center gap-3">
                        Check Availability <ArrowRight size={18} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2">Pickup Location</label>
                      <div className="relative bg-[#F3F1EB] rounded-2xl px-4 py-3 flex items-center focus-within:ring-2 ring-[#8A9A74]/30 transition-all">
                        <MapPin size={18} className="text-[#8A9A74] mr-3" />
                        {isLoaded ? (
                          <Autocomplete onLoad={(auto) => (cabPickupRef.current = auto)} onPlaceChanged={() => handleCabPlaceChanged(cabPickupRef, 'pickup')}>
                            <input type="text" placeholder="Where from?" className="w-full bg-transparent text-[#2C2C2C] placeholder-gray-400 outline-none font-medium" />
                          </Autocomplete>
                        ) : (
                          <input type="text" placeholder="Loading..." disabled className="w-full bg-transparent text-[#2C2C2C] placeholder-gray-400 outline-none font-medium" />
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2">Drop Location</label>
                      <div className="relative bg-[#F3F1EB] rounded-2xl px-4 py-3 flex items-center focus-within:ring-2 ring-[#8A9A74]/30 transition-all">
                        <Navigation size={18} className="text-[#8A9A74] mr-3" />
                        {isLoaded ? (
                          <Autocomplete onLoad={(auto) => (cabDropRef.current = auto)} onPlaceChanged={() => handleCabPlaceChanged(cabDropRef, 'drop')}>
                            <input type="text" placeholder="Where to?" className="w-full bg-transparent text-[#2C2C2C] placeholder-gray-400 outline-none font-medium" />
                          </Autocomplete>
                        ) : (
                          <input type="text" placeholder="Loading..." disabled className="w-full bg-transparent text-[#2C2C2C] placeholder-gray-400 outline-none font-medium" />
                        )}
                      </div>
                    </div>
                    <div className="md:col-span-2 flex justify-center mt-6">
                      <button onClick={handleCabSearchSubmit} className="px-10 py-4 bg-[#8A9A74] hover:bg-[#788863] text-white rounded-full font-bold shadow-lg shadow-[#8A9A74]/30 transition-colors flex items-center gap-3">
                        Find Rides <Car size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;
