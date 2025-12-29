import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ModalProvider } from './context/ModalContext';
import TokenHandler from './components/TokenHandler';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Bookings from './pages/Bookings';
import Layout from './Layout';
import Vendors from './pages/Vendors';
import Properties from './pages/Properties';
import Settings from './pages/Settings';
import Customers from './pages/Customers';
import PropertyApproval from './pages/PropertyApproval';
import VendorDetails from './pages/VendorDetails';
import PropertyChangeRequests from './pages/PropertyChangeRequests';
import ReviewPropertyChange from './pages/ReviewPropertyChange';
import SetPassword from './pages/SetPassword';
import AdminCalendar from './pages/AdminCalendar';
import AdminEventLogs from './pages/AdminEventLogs';
import HolidayApprovals from './pages/HolidayApprovals';
import adminAnalytics from './utils/analytics';
import Intelligence from './pages/Intelligence';
import VendorPresentation from './pages/VendorPresentation';
import InvestorPresentation from './pages/InvestorPresentation';
import './App.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>Loading...</div>;
  }

  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <ModalProvider>
        <BrowserRouter basename="/admin">
          <TokenHandler />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/set-password" element={<SetPassword />} />

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
              <Route path="/vendors/:id" element={<VendorDetails />} />
              <Route path="/bookings" element={<Bookings />} />
              <Route path="/calendar" element={<AdminCalendar />} />
              <Route path="/analytics" element={<AdminEventLogs />} />
              <Route path="/properties" element={<Properties />} />
              <Route path="/properties/:id/approve" element={<PropertyApproval />} />
              <Route path="/property-changes" element={<PropertyChangeRequests />} />
              <Route path="/properties/:id/changes/:requestId" element={<ReviewPropertyChange />} />
              <Route path="/approvals/holidays" element={<HolidayApprovals />} />

              <Route path="/holidays" element={<div style={{ padding: 20 }}>Holidays (Placeholder)</div>} />

              <Route path="/intelligence" element={<Intelligence />} />
              <Route path="/vendor-presentation" element={<VendorPresentation />} />
              <Route path="/investor-presentation" element={<InvestorPresentation />} />
            </Route>

            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </BrowserRouter>
      </ModalProvider>
    </AuthProvider>
  );
}

export default App;
