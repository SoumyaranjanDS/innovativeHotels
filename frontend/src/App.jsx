import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import { Agentation } from 'agentation';

// Layouts
import MainLayout from './layouts/MainLayout';
import ProviderLayout from './layouts/ProviderLayout';
import AdminLayout from './layouts/AdminLayout';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ProviderDashboard from './pages/ProviderDashboard';
import ProviderHotelRooms from './pages/ProviderHotelRooms';
import ProviderHotelBookings from './pages/ProviderHotelBookings';
import SelectService from './pages/SelectService';
import HotelOnboarding from './pages/HotelOnboarding';
import HotelCabOnboarding from './pages/HotelCabOnboarding';
import CabOnboarding from './pages/CabOnboarding';
import ProviderDocuments from './pages/ProviderDocuments';
import ProviderEarnings from './pages/ProviderEarnings';
import AdminDashboard from './pages/AdminDashboard';
import AdminHotelApprovals from './pages/AdminHotelApprovals';
import AdminCabApprovals from './pages/AdminCabApprovals';
import AdminHotelCabsView from './pages/AdminHotelCabsView';
import AdminExternalCabsView from './pages/AdminExternalCabsView';
import AdminUsers from './pages/AdminUsers';
import AdminBookings from './pages/AdminBookings';
import AdminPayments from './pages/AdminPayments';
import AdminSettlements from './pages/AdminSettlements';
import AdminSupport from './pages/AdminSupport';
import CabBooking from './pages/CabBooking';
import CabLiveTracking from './pages/CabLiveTracking';
import CabDriverDashboard from './pages/CabDriverDashboard';
import DriverDashboard from './pages/DriverDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import Checkout from './pages/Checkout';
import HotelListingPage from './pages/HotelListingPage';
import HotelDetailPage from './pages/HotelDetailPage';
import HotelBookingConfirmation from './pages/HotelBookingConfirmation';
import CustomerHotelBookingDetail from './pages/CustomerHotelBookingDetail';
import ProviderReviews from './pages/ProviderReviews';
import CustomerSupportDashboard from './pages/CustomerSupportDashboard';
import ProviderSupport from './pages/ProviderSupport';
import AdminWithdrawals from './pages/AdminWithdrawals';

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
              <Route path="/hotels" element={<HotelListingPage />} />
              <Route path="/hotels/:hotelId" element={<HotelDetailPage />} />
              <Route path="/features" element={<Features />} />
              <Route path="/earning" element={<Earning />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/faq" element={<FAQ />} />
              
              {/* Protected Customer Routes within MainLayout */}
              <Route path="/checkout" element={<ProtectedRoute allowedRoles={['Customer']}><Checkout /></ProtectedRoute>} />
              <Route path="/hotel-booking/confirmation/:bookingId" element={<ProtectedRoute allowedRoles={['Customer']}><HotelBookingConfirmation /></ProtectedRoute>} />
              <Route path="/hotel-booking/:bookingId" element={<ProtectedRoute allowedRoles={['Customer']}><CustomerHotelBookingDetail /></ProtectedRoute>} />
              <Route path="/my-bookings" element={<ProtectedRoute allowedRoles={['Customer']}><CustomerDashboard /></ProtectedRoute>} />
              <Route path="/customer-dashboard" element={<ProtectedRoute allowedRoles={['Customer']}><CustomerDashboard /></ProtectedRoute>} />
            </Route>

            {/* Standalone Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Customer Routes (Standalone) */}
            <Route path="/cab-booking" element={<ProtectedRoute allowedRoles={['Customer']}><CabBooking /></ProtectedRoute>} />
            <Route path="/cab-tracking/:bookingId" element={<ProtectedRoute allowedRoles={['Customer']}><CabLiveTracking /></ProtectedRoute>} />
            <Route path="/support" element={<ProtectedRoute allowedRoles={['Customer']}><CustomerSupportDashboard /></ProtectedRoute>} />

            {/* Provider Routes */}
            <Route path="/provider/onboarding/select-service" element={<ProtectedRoute allowedRoles={['Provider']}><SelectService /></ProtectedRoute>} />
            <Route path="/provider/onboarding/hotel" element={<ProtectedRoute allowedRoles={['Provider']}><HotelOnboarding /></ProtectedRoute>} />
            <Route path="/provider/onboarding/hotel-cab" element={<ProtectedRoute allowedRoles={['Provider']}><HotelCabOnboarding /></ProtectedRoute>} />
            <Route path="/provider/onboarding/cab" element={<ProtectedRoute allowedRoles={['Provider']}><CabOnboarding /></ProtectedRoute>} />
            <Route path="/provider" element={<ProtectedRoute allowedRoles={['Provider']}><ProviderLayout /></ProtectedRoute>}>
              <Route path="dashboard" element={<ProviderDashboard />} />
              <Route path="hotel/rooms" element={<ProviderHotelRooms />} />
              <Route path="hotel/bookings" element={<ProviderHotelBookings />} />
              <Route path="documents" element={<ProviderDocuments />} />
              <Route path="earnings" element={<ProviderEarnings />} />
              <Route path="reviews" element={<ProviderReviews />} />
              <Route path="support" element={<ProviderSupport />} />
              <Route path="cab-dashboard" element={<CabDriverDashboard />} />
              <Route path="driver-dashboard" element={<DriverDashboard />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['Admin']}><AdminLayout /></ProtectedRoute>}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="approvals/hotels" element={<AdminHotelApprovals />} />
              <Route path="approvals/cabs" element={<AdminCabApprovals />} />
              <Route path="cabs/hotel" element={<AdminHotelCabsView />} />
              <Route path="cabs/external" element={<AdminExternalCabsView />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="bookings" element={<AdminBookings />} />
              <Route path="payments" element={<AdminPayments />} />
              <Route path="settlements" element={<AdminSettlements />} />
              <Route path="support" element={<AdminSupport />} />
              <Route path="withdrawals" element={<AdminWithdrawals />} />
            </Route>

          </Routes>
          {!import.meta.env.PROD && <Agentation />}
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
