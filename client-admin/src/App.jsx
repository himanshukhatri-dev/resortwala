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
import AddProperty from './pages/AddProperty'; // Import New Page
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
import BulkUpload from './pages/BulkUpload';
import BulkUploadDetails from './pages/BulkUploadDetails';
import InvestorPresentation from './pages/InvestorPresentation';
import RevenueDashboard from './pages/Revenue/RevenueDashboard';
import DbControl from './pages/Internal/DbControl';
import VendorLeads from './pages/VendorLeads';
import VendorLeadDetails from './pages/VendorLeadDetails';
import Payments from './pages/Payments';
import Coupons from './pages/Coupons';
import Reconciliation from './pages/Reconciliation';
import Communications from './pages/Communications';
import Connectors from './pages/Connectors';
import Notifications from './pages/Notifications';
import LeadCrawler from './pages/Intelligence/LeadCrawler';
import ComingSoon from './pages/ComingSoon';
import ChatbotManager from './pages/ChatbotManager';
import AIVideoGenerator from './pages/AIVideoGenerator';
import AISocialVideoStudio from './pages/AISocialVideoStudio';
import PromptVideoStudio from './pages/PromptVideoStudio';
import VoiceStudio from './pages/VoiceStudio';
import ConnectorReports from './pages/ConnectorReports';
import MediaRestoreConsole from './pages/MediaRestoreConsole';
import ServerMigration from './pages/ServerMigration/ServerMigration';
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
              <Route path="/intelligence/logs" element={<AdminEventLogs />} />
              <Route path="/properties" element={<Properties />} />
              <Route path="/properties/pending" element={<Properties initialFilter="pending" />} />
              <Route path="/properties/add" element={<AddProperty />} />
              <Route path="/properties/:id/approve" element={<PropertyApproval />} />
              <Route path="/property-changes" element={<PropertyChangeRequests />} />
              <Route path="/properties/:id/changes/:requestId" element={<ReviewPropertyChange />} />
              <Route path="/approvals/holidays" element={<HolidayApprovals />} />

              <Route path="/holidays" element={<HolidayApprovals />} />

              <Route path="/intelligence" element={<Intelligence />} />
              <Route path="/intelligence/leads" element={<LeadCrawler />} />
              <Route path="/connectors" element={<Connectors />} />
              <Route path="/connectors/reports" element={<ConnectorReports />} />
              <Route path="/vendor-presentation" element={<VendorPresentation />} />
              <Route path="/ai-video-generator" element={<AIVideoGenerator />} />
              <Route path="/ai-video-studio" element={<AISocialVideoStudio />} />
              <Route path="/prompt-video-studio" element={<PromptVideoStudio />} />
              <Route path="/voice-studio" element={<VoiceStudio />} />
              {/* SRE Media Tool */}
              <Route path="/media/restore-images" element={<MediaRestoreConsole />} />

              {/* Settings & System */}
              <Route path="/investor-presentation" element={<InvestorPresentation />} />
              <Route path="/bulk-upload" element={<BulkUpload />} />
              <Route path="/bulk-upload/:id" element={<BulkUploadDetails />} />
              <Route path="/revenue/full-rate-control" element={<RevenueDashboard />} />
              <Route path="/vendor-leads" element={<VendorLeads />} />
              <Route path="/vendor-leads/:id" element={<VendorLeadDetails />} />
              <Route path="/internal/db-control" element={<DbControl />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/coupons" element={<Coupons />} />
              <Route path="/connectors" element={<Connectors />} /> {/* New Route */}
              <Route path="/reconciliation" element={<Reconciliation />} /> {/* New Route */}
              <Route path="/server-migration" element={<ServerMigration />} />
              <Route path="/communications" element={<Communications />} /> {/* New Route */}

              <Route path="/notifications" element={<Notifications />} />
              <Route path="/chatbot" element={<ChatbotManager />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<div className="p-20 text-center font-bold text-red-500">404: Route Not Found. Path: {window.location.pathname}</div>} />
            </Route>

            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </BrowserRouter>
      </ModalProvider>
    </AuthProvider>
  );
}

export default App;
