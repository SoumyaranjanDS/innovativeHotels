import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Building2, Car, FileText, Wallet, LogOut, MapPin, ClipboardList } from 'lucide-react';

const ProviderLayout = () => {
  const [activeService, setActiveService] = useState('hotel');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const initial = (user?.name || 'P').charAt(0).toUpperCase();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-100 flex flex-col shadow-sm">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <img src="/inno-logo.jpeg" alt="Innovative Hotel Solution" className="h-10 object-contain" />
            <span className="text-primary font-heading font-bold text-sm leading-tight hidden lg:block">Innovative</span>
          </Link>

          {/* Service Switcher */}
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

          {/* Navigation */}
          <nav className="space-y-1">
            <Link to="/provider/dashboard" className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-primary/10 text-primary font-semibold text-sm">
              <LayoutDashboard size={16} /> Dashboard
            </Link>

            {activeService === 'hotel' && (
              <>
                <Link to="/provider/hotel/rooms" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-primary transition text-sm">
                  <ClipboardList size={16} /> Manage Rooms
                </Link>
                <Link to="/provider/hotel/bookings" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-primary transition text-sm">
                  <FileText size={16} /> Hotel Bookings
                </Link>
              </>
            )}

            {activeService === 'cab' && (
              <>
                <Link to="/provider/cab-dashboard" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-primary transition text-sm">
                  <Car size={16} /> Driver Dashboard
                </Link>
                <Link to="/provider/cab/vehicles" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-primary transition text-sm">
                  <ClipboardList size={16} /> Manage Vehicles
                </Link>
              </>
            )}

            <Link to="/provider/documents" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-primary transition text-sm">
              <FileText size={16} /> Documents
            </Link>
            <Link to="/provider/earnings" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-primary transition text-sm">
              <Wallet size={16} /> Earnings
            </Link>
          </nav>
        </div>
        <div className="mt-auto p-6 border-t border-gray-100">
          <button onClick={handleLogout} className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition text-sm w-full">
            <LogOut size={16} /> Log out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm border-b border-gray-100 px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-heading font-semibold text-gray-800 capitalize">{activeService} Dashboard</h1>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-800">{user?.name || 'Provider'}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
              {initial}
            </div>
          </div>
        </header>

        <main className="p-8">
          <Outlet context={{ activeService }} />
        </main>
      </div>
    </div>
  );
};

export default ProviderLayout;
