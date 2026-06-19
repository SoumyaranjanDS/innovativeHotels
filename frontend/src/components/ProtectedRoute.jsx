import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token, loading } = useContext(AuthContext);

  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!token || !user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  if (allowedRoles && user?.role) {
    const hasRole = allowedRoles.some(
      (role) => role.toLowerCase() === user.role.toLowerCase()
    );
    if (!hasRole) {
      return <Navigate to="/" replace />; // Redirect to home if unauthorized
    }
  }

  return children;
};

export default ProtectedRoute;
