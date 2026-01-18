import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NotificationInitializer from './components/common/NotificationInitializer';
import MainLayout from './layouts/MainLayout';
import ScrollToTop from './components/utils/ScrollToTop';
import PageTracker from './components/utils/PageTracker';
import TokenHandler from './components/common/TokenHandler';
import { Toaster } from 'react-hot-toast';

import { NotificationProvider } from './context/NotificationContext';

import { AuthProvider } from './context/AuthContext';
import { SearchProvider } from './context/SearchContext';
import { WishlistProvider } from './context/WishlistContext';
import { CompareProvider } from './context/CompareContext';

import ErrorBoundary from './components/common/ErrorBoundary';
import CompareFloatingBar from './components/features/CompareFloatingBar';
import CompareModal from './components/features/CompareModal';
import ComingSoonGuard from './components/common/ComingSoonGuard';
import ChatWidget from './components/chat/ChatWidget';
import VersionChecker from './components/common/VersionChecker';

// Lazy Load Pages
const Home = lazy(() => import('./pages/Home'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const PropertyDetails = lazy(() => import('./pages/PropertyDetails'));
const BookingPage = lazy(() => import('./pages/BookingPage'));
const BookingDetails = lazy(() => import('./pages/BookingDetails'));
const UserBookings = lazy(() => import('./pages/UserBookings'));
const Profile = lazy(() => import('./pages/Profile'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const PublicPropertyCalendar = lazy(() => import('./pages/PublicPropertyCalendar'));
const Contact = lazy(() => import('./pages/Contact'));
const About = lazy(() => import('./pages/About'));
const Policy = lazy(() => import('./pages/Policy'));
const SetPassword = lazy(() => import('./pages/SetPassword'));
const BookingSuccess = lazy(() => import('./pages/BookingSuccess'));
const BookingFailed = lazy(() => import('./pages/BookingFailed'));
const BookingPending = lazy(() => import('./pages/BookingPending'));

// Loading Fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="w-16 h-16 border-4 border-gray-100 border-t-black rounded-full animate-spin"></div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SearchProvider>
          <WishlistProvider>
            <CompareProvider>
              <NotificationProvider>
                <BrowserRouter>
                  <ComingSoonGuard>
                    <ScrollToTop />
                    <PageTracker />
                    <TokenHandler />
                    <NotificationInitializer />
                    <VersionChecker />
                    <Toaster position="top-center" />

                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        <Route path="/" element={<MainLayout />}>
                          <Route index element={<Home />} />
                          <Route path="/notifications" element={<Notifications />} />
                          <Route path="/property/:id" element={<PropertyDetails />} />
                          <Route path="/book/:id" element={<BookingPage />} />
                          <Route path="/checkout/:id" element={<BookingPage />} />
                          <Route path="/bookings" element={<UserBookings />} />
                          <Route path="/bookings/:id" element={<BookingDetails />} />
                          <Route path="/booking/success" element={<BookingSuccess />} />
                          <Route path="/booking/failed" element={<BookingFailed />} />
                          <Route path="/booking/pending" element={<BookingPending />} />
                          <Route path="/wishlist" element={<Wishlist />} />
                          <Route path="/profile" element={<Profile />} />
                          <Route path="/contact" element={<Contact />} />
                          <Route path="/about" element={<About />} />
                          <Route path="/policy/:type" element={<Policy />} />
                        </Route>

                        {/* Public Standalone Calendar View */}
                        <Route path="/stay/:uuid" element={<PublicPropertyCalendar />} />

                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/set-password" element={<SetPassword />} />
                      </Routes>
                    </Suspense>

                    {/* Global Floating Bar & Modal */}
                    <CompareFloatingBar />
                    <CompareModal />
                    <ChatWidget />
                  </ComingSoonGuard>
                </BrowserRouter>
              </NotificationProvider>
            </CompareProvider>
          </WishlistProvider>
        </SearchProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
