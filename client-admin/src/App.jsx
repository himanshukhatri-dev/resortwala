import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Bookings from './pages/Bookings';
import Layout from './Layout';
import Vendors from './pages/Vendors';
import Properties from './pages/Properties';

import Customers from './pages/Customers';
import './App.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>Loading...</div>;
  }

  return user ? children : <Navigate to="/login" />;
}




import { ModalProvider } from './context/ModalContext';
import TokenHandler from './components/TokenHandler';

function App() {
  return (
    <AuthProvider>
      <ModalProvider>
        <BrowserRouter>
          <TokenHandler />
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Protected Routes with Layout */}
            <Route element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/users" element={<Users />} />
              <Route path="/vendors" element={<Vendors />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/bookings" element={<Bookings />} />
              <Route path="/properties" element={<Properties />} />
              <Route path="/day-wise-booking" element={<div style={{ padding: 20 }}>Day Wise Booking (Placeholder)</div>} />
              <Route path="/holidays" element={<div style={{ padding: 20 }}>Holidays (Placeholder)</div>} />
              <Route path="/reviews" element={<div style={{ padding: 20 }}>Reviews (Placeholder)</div>} />
            </Route>

            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </BrowserRouter>
      </ModalProvider>
    </AuthProvider>
  );
}

export default App;
