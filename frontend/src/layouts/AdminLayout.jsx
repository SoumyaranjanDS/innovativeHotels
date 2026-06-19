import React from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Building2, Car, Users, CreditCard, Headphones, Settings, LogOut, ShieldCheck, Menu, X } from 'lucide-react';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const initial = (user?.name || 'A').charAt(0).toUpperCase();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-primary-dark text-white flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <Link to="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
              <img src="/inno-logo.jpeg" alt="Innovative Hotel Solution" className="h-10 object-contain rounded-md" />
              <span className="font-heading font-bold text-sm leading-tight text-white">Innovative</span>
            </Link>
            <button className="md:hidden text-white/70 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <nav className="space-y-0.5 flex-1">
            <NavLink to="/admin/dashboard" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg transition text-sm ${isActive ? 'bg-white/10 font-semibold text-white' : 'text-white/80 hover:bg-white/10'}`}>
              <LayoutDashboard size={16} /> Overview
            </NavLink>

            <div className="pt-3 pb-1 px-1 text-[10px] font-bold uppercase tracking-widest text-accent/70">Approvals</div>
            <NavLink to="/admin/approvals/hotels" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-3 py-1.5 rounded-lg transition text-sm ${isActive ? 'bg-white/10 font-semibold text-white' : 'text-white/80 hover:bg-white/10'}`}>
              <Building2 size={16} /> Hotel Approvals
            </NavLink>
            <NavLink to="/admin/approvals/cabs" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-3 py-1.5 rounded-lg transition text-sm ${isActive ? 'bg-white/10 font-semibold text-white' : 'text-white/80 hover:bg-white/10'}`}>
              <Car size={16} /> Cab Approvals
            </NavLink>

            <div className="pt-3 pb-1 px-1 text-[10px] font-bold uppercase tracking-widest text-accent/70">Management</div>
            <NavLink to="/admin/cabs/hotel" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-3 py-1.5 rounded-lg transition text-sm ${isActive ? 'bg-white/10 font-semibold text-white' : 'text-white/80 hover:bg-white/10'}`}>
              <Car size={16} /> Hotel Cabs
            </NavLink>
            <NavLink to="/admin/cabs/external" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-3 py-1.5 rounded-lg transition text-sm ${isActive ? 'bg-white/10 font-semibold text-white' : 'text-white/80 hover:bg-white/10'}`}>
              <Car size={16} /> External Cabs
            </NavLink>
            <NavLink to="/admin/users" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-3 py-1.5 rounded-lg transition text-sm ${isActive ? 'bg-white/10 font-semibold text-white' : 'text-white/80 hover:bg-white/10'}`}>
              <Users size={16} /> Users & Providers
            </NavLink>
            <NavLink to="/admin/bookings" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-3 py-1.5 rounded-lg transition text-sm ${isActive ? 'bg-white/10 font-semibold text-white' : 'text-white/80 hover:bg-white/10'}`}>
              <ShieldCheck size={16} /> All Bookings
            </NavLink>

            <div className="pt-3 pb-1 px-1 text-[10px] font-bold uppercase tracking-widest text-accent/70">Finance</div>
            <NavLink to="/admin/payments" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-3 py-1.5 rounded-lg transition text-sm ${isActive ? 'bg-white/10 font-semibold text-white' : 'text-white/80 hover:bg-white/10'}`}>
              <CreditCard size={16} /> Payments & Refunds
            </NavLink>
            <NavLink to="/admin/settlements" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-3 py-1.5 rounded-lg transition text-sm ${isActive ? 'bg-white/10 font-semibold text-white' : 'text-white/80 hover:bg-white/10'}`}>
              <Settings size={16} /> Settlements
            </NavLink>
            <NavLink to="/admin/withdrawals" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-3 py-1.5 rounded-lg transition text-sm ${isActive ? 'bg-white/10 font-semibold text-white' : 'text-white/80 hover:bg-white/10'}`}>
              <CreditCard size={16} /> Withdrawal Requests
            </NavLink>

            <div className="pt-3 pb-1 px-1 text-[10px] font-bold uppercase tracking-widest text-accent/70">System</div>
            <NavLink to="/admin/support" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-3 py-1.5 rounded-lg transition text-sm ${isActive ? 'bg-white/10 font-semibold text-white' : 'text-white/80 hover:bg-white/10'}`}>
              <Headphones size={16} /> Support Tickets
            </NavLink>
          </nav>
        </div>
        <div className="p-4 border-t border-white/10 shrink-0">
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl transition text-sm font-bold w-full shadow-sm">
            <LogOut size={16} /> Log out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto flex flex-col min-w-0">
        <header className="bg-white shadow-sm border-b border-gray-100 px-4 md:px-8 py-4 flex justify-between items-center sticky top-0 z-20">
          <div className="flex items-center gap-3 md:gap-4">
            <button className="md:hidden text-gray-500 hover:text-primary transition" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-heading font-semibold text-gray-800 truncate">Admin Portal</h1>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-800 truncate max-w-[120px]">{user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-400 truncate max-w-[120px]">{user?.email}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
              {initial}
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
