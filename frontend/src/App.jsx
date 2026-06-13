import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';

// Layouts
import MainLayout from './layouts/MainLayout';
import ProviderLayout from './layouts/ProviderLayout';
import AdminLayout from './layouts/AdminLayout';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ProviderDashboard from './pages/ProviderDashboard';
import SelectService from './pages/SelectService';
import HotelOnboarding from './pages/HotelOnboarding';
import CabOnboarding from './pages/CabOnboarding';
import AdminDashboard from './pages/AdminDashboard';
import CabBooking from './pages/CabBooking';
import CabLiveTracking from './pages/CabLiveTracking';
import CabDriverDashboard from './pages/CabDriverDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import Checkout from './pages/Checkout';

// Info Pages
import Features from './pages/info/Features';
import Earning from './pages/info/Earning';
import AboutUs from './pages/info/AboutUs';
import FAQ from './pages/info/FAQ';

import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-background text-gray-900">
          <ToastContainer position="top-right" autoClose={3000} />
          <Routes>
            
            {/* Public Routes with MainLayout (Navbar + Footer) */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/features" element={<Features />} />
              <Route path="/earning" element={<Earning />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/faq" element={<FAQ />} />
            </Route>

            {/* Standalone Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Customer Routes (Standalone for now, can be put in MainLayout if needed) */}
            <Route path="/checkout" element={<ProtectedRoute allowedRoles={['Customer']}><Checkout /></ProtectedRoute>} />
            <Route path="/cab-booking" element={<ProtectedRoute allowedRoles={['Customer']}><CabBooking /></ProtectedRoute>} />
            <Route path="/cab-tracking/:bookingId" element={<ProtectedRoute allowedRoles={['Customer']}><CabLiveTracking /></ProtectedRoute>} />
            <Route path="/my-bookings" element={<ProtectedRoute allowedRoles={['Customer']}><CustomerDashboard /></ProtectedRoute>} />

            {/* Provider Routes */}
            <Route path="/provider/onboarding/select-service" element={<ProtectedRoute allowedRoles={['Provider']}><SelectService /></ProtectedRoute>} />
            <Route path="/provider/onboarding/hotel" element={<ProtectedRoute allowedRoles={['Provider']}><HotelOnboarding /></ProtectedRoute>} />
            <Route path="/provider/onboarding/cab" element={<ProtectedRoute allowedRoles={['Provider']}><CabOnboarding /></ProtectedRoute>} />
            <Route path="/provider" element={<ProtectedRoute allowedRoles={['Provider']}><ProviderLayout /></ProtectedRoute>}>
              <Route path="dashboard" element={<ProviderDashboard />} />
              <Route path="cab-dashboard" element={<CabDriverDashboard />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['Admin']}><AdminLayout /></ProtectedRoute>}>
              <Route path="dashboard" element={<AdminDashboard />} />
            </Route>

          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
