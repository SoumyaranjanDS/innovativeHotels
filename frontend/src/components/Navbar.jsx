import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, LogOut, ChevronDown, Menu, X, Crown, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > 100) {
        if (currentScrollY > lastScrollY.current) {
          setVisible(false); // scrolling down
        } else {
          setVisible(true); // scrolling up
        }
      } else {
        setVisible(true);
      }
      
      setScrolled(currentScrollY > 20);
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/');
  };

  const navLinks = [
    { name: 'Hotels', path: '/hotels' },
    { name: 'Cabs', path: '/cab-booking' },
    { name: 'Features', path: '/features' },
    { name: 'About Us', path: '/about' },
  ];

  return (
    <>
      <nav 
        className={`w-full fixed top-0 z-50 transition-all duration-300 ${
          visible ? 'translate-y-0' : '-translate-y-full'
        } ${
          scrolled ? 'bg-transparent py-4' : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex justify-between items-center relative">
          
          {/* Left: Brand / Logo */}
          <Link to="/" className="flex items-center gap-3 z-50">
            <div className="flex flex-col">
              <img src="/inno-logo.jpeg" alt="Innovative Hotel Solution" className="h-16 object-contain rounded-xl shadow-sm" />
            </div>
          </Link>

          {/* Center: Desktop Links */}
          <div className="hidden lg:flex items-center gap-8 z-50">
            {navLinks.map((link) => (
              <Link 
                key={link.name}
                to={link.path}
                className="text-[#2C2C2C] hover:text-accent font-medium text-sm transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right: CTA & Actions */}
          <div className="hidden lg:flex items-center gap-6 z-50">

            {user ? (
              <div className="relative z-50" ref={dropdownRef}>
                <button 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 bg-white border border-gray-200 shadow-sm px-4 py-2 rounded-full hover:bg-gray-50 transition"
                >
                  <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-xs font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">{user.name}</span>
                  <ChevronDown size={14} className="text-gray-500" />
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
                    >
                      <div className="p-4 bg-gray-50 border-b border-gray-100">
                        <p className="font-bold text-gray-800">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        <span className="inline-block mt-2 px-2 py-0.5 bg-accent/10 text-accent text-xs rounded-full font-medium">
                          {user.role}
                        </span>
                      </div>
                      <div className="p-2">
                        <Link 
                          to={user.role === 'Provider' ? '/provider/dashboard' : user.role === 'Admin' ? '/admin/dashboard' : '/my-bookings'}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition"
                        >
                          <LayoutDashboard size={16} className="text-gray-400" />
                          Dashboard
                        </Link>
                        <button 
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition mt-1"
                        >
                          <LogOut size={16} />
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-sm font-medium text-[#2C2C2C] hover:text-accent transition">Log in</Link>
                <Link to="/register" className="bg-accent hover:bg-[#788863] text-white px-5 py-2.5 rounded-full text-sm font-medium transition shadow-md shadow-accent/20">
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden w-12 h-12 flex items-center justify-center bg-white rounded-full shadow-sm z-50 text-[#2C2C2C]"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Fullscreen Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-[#FAF9F5] z-40 flex flex-col items-center justify-center lg:hidden"
          >
            <div className="flex flex-col items-center gap-8 w-full px-6">
              {navLinks.map((link, i) => (
                <motion.div key={link.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <Link 
                    to={link.path} 
                    onClick={() => setMobileMenuOpen(false)} 
                    className="text-3xl font-heading text-[#2C2C2C] hover:text-accent transition-colors"
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
              
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} className="w-16 h-px bg-gray-300 my-4"></motion.div>

              {user ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex flex-col items-center gap-6">
                  <Link to={user.role === 'Provider' ? '/provider/dashboard' : user.role === 'Admin' ? '/admin/dashboard' : '/my-bookings'} onClick={() => setMobileMenuOpen(false)} className="text-accent text-xl font-heading flex items-center gap-2">
                    <LayoutDashboard size={20} /> Dashboard
                  </Link>
                  <button onClick={handleLogout} className="text-red-500 text-lg flex items-center gap-2">
                    <LogOut size={18} /> Logout
                  </button>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex flex-col w-full max-w-xs gap-4 mt-4">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-4 rounded-full border-2 border-gray-200 text-gray-700 font-medium">Login</Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-4 rounded-full bg-accent text-white font-medium shadow-md">Register</Link>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
