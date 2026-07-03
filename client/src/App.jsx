import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';

// Layout
import DashboardLayout from './layouts/DashboardLayout.jsx';

// Guard Component
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Public Pages
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import Landing from './pages/Landing.jsx';

// Customer Pages
import CustomerDashboard from './pages/customer/CustomerDashboard.jsx';
import PlaceOrder from './pages/customer/PlaceOrder.jsx';
import TrackOrder from './pages/customer/TrackOrder.jsx';

// Agent Pages
import AgentDashboard from './pages/agent/AgentDashboard.jsx';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import ManageZones from './pages/admin/ManageZones.jsx';
import ManageAreas from './pages/admin/ManageAreas.jsx';
import ManageRateCards from './pages/admin/ManageRateCards.jsx';

// Helper component to redirect based on auth status & role
const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div class="min-h-screen flex items-center justify-center bg-gray-50">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (user.role === 'AGENT') return <Navigate to="/agent" replace />;
  return <Navigate to="/customer" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Customer Scoped Dashboard Routes */}
          <Route
            path="/customer"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <DashboardLayout>
                  <CustomerDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/place-order"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <DashboardLayout>
                  <PlaceOrder />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          
          {/* Shared Track Order timeline route */}
          <Route
            path="/customer/track/:id"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER', 'AGENT', 'ADMIN']}>
                <DashboardLayout>
                  <TrackOrder />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Agent Scoped Dashboard Routes */}
          <Route
            path="/agent"
            element={
              <ProtectedRoute allowedRoles={['AGENT']}>
                <DashboardLayout>
                  <AgentDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin Scoped Dashboard Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout>
                  <AdminDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/zones"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout>
                  <ManageZones />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/areas"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout>
                  <ManageAreas />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/rates"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout>
                  <ManageRateCards />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Fallback Root Redirect */}
          <Route path="/dashboard" element={<RootRedirect />} />
          <Route path="/" element={<Landing />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
