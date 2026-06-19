import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Building2, Car, FileText, Wallet, LogOut, MapPin, ClipboardList, Star, Menu, X, Headphones } from 'lucide-react';

const ProviderLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeService, setActiveService] = useState(user?.providerType === 'Cab' ? 'cab' : 'hotel');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const initial = (user?.name || 'P').charAt(0).toUpperCase();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 flex flex-col shadow-sm transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <img src="/inno-logo.jpeg" alt="Innovative Hotel Solution" className="h-10 object-contain" />
            <span className="text-primary font-heading font-bold text-sm leading-tight block">Innovative</span>
          </Link>
          <button className="lg:hidden text-gray-500 hover:text-primary" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="px-6 flex-1 overflow-y-auto">

          {/* Service Switcher - Only show if not exclusively a Cab Agency and not a Driver */}
          {user?.providerType !== 'Cab' && user?.providerType !== 'Driver' && (
            <div className="bg-gray-100 p-1 rounded-lg flex mb-8">
              <button
                onClick={() => setActiveService('hotel')}
                className={`flex-1 py-2 text-xs font-semibold rounded-md transition flex items-center justify-center gap-1.5 ${activeService === 'hotel' ? 'bg-primary text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Building2 size={14} /> Hotel
              </button>
              <button
                onClick={() => setActiveService('cab')}
                className={`flex-1 py-2 text-xs font-semibold rounded-md transition flex items-center justify-center gap-1.5 ${activeService === 'cab' ? 'bg-primary text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Car size={14} /> Cab
              </button>
            </div>
          )}

          {/* Navigation */}
          <nav className="space-y-1" onClick={() => setIsSidebarOpen(false)}>
            <Link 
              to={user?.providerType === 'Driver' ? "/provider/driver-dashboard" : "/provider/dashboard"} 
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-semibold text-sm transition ${
                location.pathname === (user?.providerType === 'Driver' ? "/provider/driver-dashboard" : "/provider/dashboard")
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
              }`}
            >
              <LayoutDashboard size={16} /> Dashboard
            </Link>

            {activeService === 'hotel' && user?.providerType !== 'Driver' && (
              <>
                <Link 
                  to="/provider/hotel/rooms" 
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition ${
                    location.pathname === '/provider/hotel/rooms'
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-primary font-medium'
                  }`}
                >
                  <ClipboardList size={16} /> Manage Rooms
                </Link>
                <Link 
                  to="/provider/hotel/bookings" 
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition ${
                    location.pathname === '/provider/hotel/bookings'
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-primary font-medium'
                  }`}
                >
                  <FileText size={16} /> Hotel Bookings
                </Link>
              </>
            )}

            {user?.providerType !== 'Driver' && (
              <>
                {user?.providerType === 'Cab' && (
                  <Link 
                    to="/provider/cab-dashboard" 
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition ${
                      location.pathname === '/provider/cab-dashboard'
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-primary font-medium'
                    }`}
                  >
                    <MapPin size={16} /> Live Rides
                  </Link>
                )}
                <Link 
                  to="/provider/documents" 
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition ${
                    location.pathname === '/provider/documents'
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-primary font-medium'
                  }`}
                >
                  <FileText size={16} /> Documents
                </Link>
                <Link 
                  to="/provider/earnings" 
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition ${
                    location.pathname === '/provider/earnings'
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-primary font-medium'
                  }`}
                >
                  <Wallet size={16} /> Earnings
                </Link>
                <Link 
                  to="/provider/reviews" 
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition ${
                    location.pathname === '/provider/reviews'
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-primary font-medium'
                  }`}
                >
                  <Star size={16} /> Customer Reviews
                </Link>
                <Link 
                  to="/provider/support" 
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition ${
                    location.pathname === '/provider/support'
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-primary font-medium'
                  }`}
                >
                  <Headphones size={16} /> Support Chat
                </Link>
              </>
            )}
          </nav>
        </div>
        <div className="mt-auto p-6 border-t border-gray-100">
          <button onClick={handleLogout} className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition text-sm w-full">
            <LogOut size={16} /> Log out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-100 px-4 md:px-8 py-4 flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-gray-600 hover:text-primary" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <h1 className="text-lg md:text-xl font-heading font-semibold text-gray-800 capitalize truncate">{user?.providerType === 'Driver' ? 'Driver Dashboard' : `${activeService} Dashboard`}</h1>
          </div>
          <div className="flex items-center gap-3 ml-2">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-800">{user?.name || 'Provider'}</p>
              <p className="text-xs text-gray-400 truncate max-w-[150px]">{user?.email}</p>
            </div>
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-primary text-white flex shrink-0 items-center justify-center font-bold text-sm">
              {initial}
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8 overflow-y-auto flex-1">
          <Outlet context={{ activeService }} />
        </main>
      </div>
    </div>
  );
};

export default ProviderLayout;
