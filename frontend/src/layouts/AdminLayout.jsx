import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Building2, Car, Users, CreditCard, Headphones, Settings, LogOut, ShieldCheck } from 'lucide-react';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const initial = (user?.name || 'A').charAt(0).toUpperCase();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-primary-dark text-white flex flex-col">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <img src="/inno-logo.jpeg" alt="Innovative Hotel Solution" className="h-10 object-contain brightness-0 invert" />
            <span className="font-heading font-bold text-sm leading-tight">Innovative</span>
          </Link>

          <nav className="space-y-1">
            <Link to="/admin/dashboard" className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-white/10 font-semibold text-sm">
              <LayoutDashboard size={16} /> Overview
            </Link>

            <div className="pt-5 pb-2 text-[10px] font-bold uppercase tracking-widest text-accent/70">Approvals</div>
            <Link to="/admin/approvals/hotels" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/10 transition text-sm text-white/80">
              <Building2 size={16} /> Hotel Approvals
            </Link>
            <Link to="/admin/approvals/cabs" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/10 transition text-sm text-white/80">
              <Car size={16} /> Cab Approvals
            </Link>

            <div className="pt-5 pb-2 text-[10px] font-bold uppercase tracking-widest text-accent/70">Management</div>
            <Link to="/admin/users" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/10 transition text-sm text-white/80">
              <Users size={16} /> Users & Providers
            </Link>
            <Link to="/admin/bookings" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/10 transition text-sm text-white/80">
              <ShieldCheck size={16} /> All Bookings
            </Link>

            <div className="pt-5 pb-2 text-[10px] font-bold uppercase tracking-widest text-accent/70">Finance</div>
            <Link to="/admin/payments" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/10 transition text-sm text-white/80">
              <CreditCard size={16} /> Payments & Refunds
            </Link>
            <Link to="/admin/settlements" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/10 transition text-sm text-white/80">
              <Settings size={16} /> Settlements
            </Link>

            <div className="pt-5 pb-2 text-[10px] font-bold uppercase tracking-widest text-accent/70">System</div>
            <Link to="/admin/support" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/10 transition text-sm text-white/80">
              <Headphones size={16} /> Support Tickets
            </Link>
          </nav>
        </div>
        <div className="mt-auto p-6 border-t border-white/10">
          <button onClick={handleLogout} className="flex items-center gap-2 text-white/60 hover:text-white transition text-sm w-full">
            <LogOut size={16} /> Log out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm border-b border-gray-100 px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-heading font-semibold text-gray-800">Admin Portal</h1>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-800">{user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
              {initial}
            </div>
          </div>
        </header>

        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
