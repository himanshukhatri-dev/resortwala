import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
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
import NotificationCenter from './pages/NotificationCenter/NotificationCenter';
import LeadCrawler from './pages/Intelligence/LeadCrawler';
import ComingSoon from './pages/ComingSoon';
import ChatbotManager from './pages/ChatbotManager';
import AIVideoGenerator from './pages/AIVideoGenerator';
import AISocialVideoStudio from './pages/AISocialVideoStudio';
import PromptVideoStudio from './pages/PromptVideoStudio';
import VoiceStudio from './pages/VoiceStudio';
import ConnectorReports from './pages/ConnectorReports';
import TutorialStudio from './pages/TutorialStudio';
import TutorialEditor from './pages/TutorialEditor';
import SharedInbox from './pages/SharedInbox';
import EmailSettings from './pages/EmailSettings';
import MediaRestoreConsole from './pages/MediaRestoreConsole';
import AccountsCenter from './pages/AccountsCenter';
import AclManagement from './pages/AclManagement';
import AuditLogs from './pages/AuditLogs';
import { ProtectedRoute, PermissionGate } from './components/ACL';
import './App.css';




function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
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
              <Route path="/users" element={<ProtectedRoute permission="users.manage"><Users /></ProtectedRoute>} />
              <Route path="/vendors" element={<ProtectedRoute permission="users.manage"><Vendors /></ProtectedRoute>} />
              <Route path="/customers" element={<ProtectedRoute permission="users.manage"><Customers /></ProtectedRoute>} />
              <Route path="/vendors/:id" element={<VendorDetails />} />
              <Route path="/bookings" element={<ProtectedRoute permission="bookings.view"><Bookings /></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute permission="bookings.view"><AdminCalendar /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute permission="analytics.view"><AdminEventLogs /></ProtectedRoute>} />
              <Route path="/intelligence/logs" element={<ProtectedRoute permission="analytics.view"><AdminEventLogs /></ProtectedRoute>} />
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
              <Route path="/voice-studio" element={<VoiceStudio />} />
              <Route path="/ai-video-studio" element={<AISocialVideoStudio />} />
              <Route path="/prompt-video-studio" element={<PromptVideoStudio />} />

              {/* Tutorial Studio */}
              <Route path="/tutorial-studio" element={<TutorialStudio />} />
              <Route path="/tutorial-studio/:id" element={<TutorialEditor />} />

              {/* Shared Inbox */}
              <Route path="/shared-inbox" element={<SharedInbox />} />
              <Route path="/settings/email" element={<EmailSettings />} />

              <Route path="/connectors" element={<Connectors />} /> {/* New Route */}
              <Route path="/reconciliation" element={<Reconciliation />} /> {/* New Route */}
              <Route path="/communications" element={<Communications />} />

              <Route path="/notifications" element={<ProtectedRoute permission="notifications.manage_templates"><NotificationCenter /></ProtectedRoute>} />
              <Route path="/accounts-center" element={<ProtectedRoute permission="accounts.view"><AccountsCenter /></ProtectedRoute>} />
              <Route path="/chatbot" element={<ProtectedRoute permission="chatbot.manage"><ChatbotManager /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute permission="system.manage_settings"><Settings /></ProtectedRoute>} />

              {/* ACL Management Tool */}
              <Route path="/security/acl" element={<ProtectedRoute permission="system.manage_acl"><AclManagement /></ProtectedRoute>} />
              <Route path="/security/audit" element={<ProtectedRoute permission="system.manage_acl"><AuditLogs /></ProtectedRoute>} />

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
