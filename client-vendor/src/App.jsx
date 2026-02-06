import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import GlobalCalendar from './pages/GlobalCalendar';
import PublicCalendar from './pages/PublicCalendar';



import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MyProperties from './pages/MyProperties';
import AddProperty from './pages/AddProperty';
import EditProperty from './pages/EditProperty';
import VendorBookings from './pages/VendorBookings';
import Holiday from './pages/Holiday';
import VendorCalendar from './pages/VendorCalendar';

import SetPassword from './pages/SetPassword';
import VerifyInvite from './pages/VerifyInvite';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>Loading...</div>;
    }

    return user ? children : <Navigate to="/login" />;
}

import { ThemeProvider } from './context/ThemeContext';
import { ModalProvider } from './context/ModalContext';

import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

import VendorLayout from './components/VendorLayout';
import Profile from './pages/Profile';
import Status from './pages/Status';

import PublicMasterCalendar from './pages/PublicMasterCalendar';
import TokenHandler from './components/common/TokenHandler';
import PageTracker from './components/common/PageTracker';
import LearningHub from './modules/LearnGrow/pages/LearningHub';
import VideoDetail from './modules/LearnGrow/pages/VideoDetail';

import { LearningProvider } from './modules/LearnGrow/context/LearningContext';
import { WalkthroughProvider } from './modules/LearnGrow/context/WalkthroughContext';
import { TutorialProvider } from './components/Tutorial/TutorialContext';
import TutorialOverlay from './components/Tutorial/TutorialOverlay';

function App() {
    return (
        <AuthProvider>
            <ThemeProvider>
                <ModalProvider>
                    <BrowserRouter basename="/vendor">
                        <TutorialProvider>
                            <LearningProvider>
                                <WalkthroughProvider>
                                    <TutorialOverlay />
                                    <PageTracker />
                                    <TokenHandler />
                                    <Routes>
                                        <Route path="/login" element={<Login />} />
                                        <Route path="/register" element={<Register />} />
                                        <Route path="/forgot-password" element={<ForgotPassword />} />
                                        <Route path="/reset-password" element={<ResetPassword />} />
                                        <Route path="/set-password" element={<SetPassword />} />
                                        <Route path="/verify-invite" element={<VerifyInvite />} />

                                        <Route path="/" element={<Navigate to="/dashboard" replace />} />

                                        <Route path="/dashboard" element={
                                            <ProtectedRoute>
                                                <VendorLayout title="Dashboard">
                                                    <Dashboard />
                                                </VendorLayout>
                                            </ProtectedRoute>
                                        } />

                                        <Route path="/properties" element={
                                            <ProtectedRoute>
                                                <VendorLayout title="My Properties">
                                                    <MyProperties />
                                                </VendorLayout>
                                            </ProtectedRoute>
                                        } />

                                        <Route path="/properties/add" element={
                                            <ProtectedRoute>
                                                <VendorLayout title="Add Property">
                                                    <AddProperty />
                                                </VendorLayout>
                                            </ProtectedRoute>
                                        } />

                                        <Route path="/properties/edit/:id" element={
                                            <ProtectedRoute>
                                                <VendorLayout title="Edit Property">
                                                    <EditProperty />
                                                </VendorLayout>
                                            </ProtectedRoute>
                                        } />

                                        <Route path="/bookings" element={
                                            <ProtectedRoute>
                                                <VendorLayout title="Bookings">
                                                    <VendorBookings />
                                                </VendorLayout>
                                            </ProtectedRoute>
                                        } />

                                        <Route path="/holiday-management" element={
                                            <ProtectedRoute>
                                                <VendorLayout title="Holiday Management">
                                                    <Holiday />
                                                </VendorLayout>
                                            </ProtectedRoute>
                                        } />

                                        <Route path="/properties/:id/calendar" element={
                                            <ProtectedRoute>
                                                <VendorLayout title="Availability Calendar">
                                                    <VendorCalendar />
                                                </VendorLayout>
                                            </ProtectedRoute>
                                        } />

                                        <Route path="/profile" element={
                                            <ProtectedRoute>
                                                <VendorLayout title="My Profile">
                                                    <Profile />
                                                </VendorLayout>
                                            </ProtectedRoute>
                                        } />

                                        <Route path="/calendar" element={
                                            <ProtectedRoute>
                                                <VendorLayout title="Master Calendar">
                                                    <GlobalCalendar />
                                                </VendorLayout>
                                            </ProtectedRoute>
                                        } />

                                        <Route path="/learning" element={
                                            <ProtectedRoute>
                                                <VendorLayout title="Learning Hub">
                                                    <LearningHub />
                                                </VendorLayout>
                                            </ProtectedRoute>
                                        } />

                                        <Route path="/learning/video/:slug" element={
                                            <ProtectedRoute>
                                                <VendorLayout title="Learning Hub">
                                                    <VideoDetail />
                                                </VendorLayout>
                                            </ProtectedRoute>
                                        } />

                                        {/* Status Page (Public for now, or protected if prefered) */}
                                        <Route path="/status" element={<Status />} />

                                        {/* Public Calendar Share Link */}
                                        <Route path="/s/:id" element={<PublicCalendar />} />
                                        <Route path="/s/m/:id" element={<PublicMasterCalendar />} />
                                    </Routes>
                                </WalkthroughProvider>
                            </LearningProvider>
                        </TutorialProvider>
                    </BrowserRouter>
                </ModalProvider>
            </ThemeProvider>
        </AuthProvider>
    );
}

export default App;
