import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserCircle, Bell, LogOut, LayoutDashboard, ChevronDown, Menu, X } from 'lucide-react';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Handle scroll effect for glassmorphism
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle outside click for dropdown
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

  // Check if on home page and not scrolled (for transparent text color)
  const isTransparent = location.pathname === '/' && !scrolled;

  const navLinks = [
    { name: 'About Us', path: '/about' },
    { name: 'Features', path: '/features' },
    { name: 'Earning', path: '/earning' },
    { name: 'FAQ', path: '/faq' },
  ];

  return (
    <nav 
      className={`w-full fixed top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 z-50">
          <img src="/inno-logo.jpeg" alt="Innovative Hotel Solution" className="h-10 md:h-12 object-contain transition-all duration-300 rounded-lg" />
          <div className="hidden lg:block">
            <span className={`font-heading font-bold text-lg leading-tight block ${isTransparent ? 'text-white' : 'text-primary'}`}>Innovative</span>
            <span className={`text-[10px] font-semibold tracking-[0.2em] uppercase ${isTransparent ? 'text-white/80' : 'text-accent'}`}>Hotel Solution</span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              to={link.path}
              className={`text-sm font-semibold hover:text-accent transition-colors ${isTransparent ? 'text-white/90' : 'text-gray-600'}`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Auth / Profile */}
        <div className="hidden lg:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-5">
              <button className={`${isTransparent ? 'text-white hover:text-accent' : 'text-gray-500 hover:text-primary'} transition relative p-1`}>
                <Bell size={22} />
                <span className="absolute -top-0.5 -right-0.5 bg-accent text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold border-2 border-white">
                  3
                </span>
              </button>

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={`flex items-center gap-2 transition outline-none ${isTransparent ? 'text-white hover:text-accent' : 'text-gray-700 hover:text-primary'}`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${isTransparent ? 'bg-white/20 text-white' : 'bg-primary text-white'}`}>
                    {(user.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-sm">{user.name || 'User'}</span>
                  <ChevronDown size={14} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-3 w-52 bg-white border border-gray-100 rounded-xl shadow-xl py-2 animate-fade-in text-gray-800">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold truncate">{user.name || 'User'}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>

                    <Link
                      to={user.role === 'Provider' ? '/provider/dashboard' : user.role === 'Admin' ? '/admin/dashboard' : '/my-bookings'}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center px-4 py-2.5 text-sm hover:bg-gray-50 hover:text-primary transition"
                    >
                      <LayoutDashboard size={16} className="mr-3 text-gray-400" />
                      Dashboard
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                    >
                      <LogOut size={16} className="mr-3" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className={`font-medium text-sm px-3 py-2 transition-colors ${isTransparent ? 'text-white hover:text-accent' : 'text-gray-600 hover:text-primary'}`}>Login</Link>
              <Link to="/register" className={`px-5 py-2 rounded-lg font-medium text-sm transition-all shadow-sm ${isTransparent ? 'bg-white text-primary hover:bg-gray-100' : 'bg-primary text-white hover:bg-primary-light'}`}>Register</Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="lg:hidden z-50 text-gray-800"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={28} className="text-gray-800" /> : <Menu size={28} className={isTransparent ? 'text-white' : 'text-gray-800'} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-white z-40 pt-24 px-6 flex flex-col h-screen overflow-y-auto">
          <div className="flex flex-col gap-6 text-xl font-heading font-semibold text-primary">
            {navLinks.map((link) => (
              <Link key={link.name} to={link.path} onClick={() => setMobileMenuOpen(false)} className="border-b border-gray-100 pb-4">
                {link.name}
              </Link>
            ))}
            
            {user ? (
              <>
                <Link to={user.role === 'Provider' ? '/provider/dashboard' : user.role === 'Admin' ? '/admin/dashboard' : '/my-bookings'} onClick={() => setMobileMenuOpen(false)} className="border-b border-gray-100 pb-4 flex items-center gap-3">
                  <LayoutDashboard size={20} /> Dashboard
                </Link>
                <button onClick={handleLogout} className="text-red-600 text-left pb-4 flex items-center gap-3 mt-4">
                  <LogOut size={20} /> Logout
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-4 mt-8">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-4 border border-primary text-primary rounded-xl">Login</Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-4 bg-primary text-white rounded-xl shadow-lg">Register</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
