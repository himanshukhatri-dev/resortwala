import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NotificationInitializer from './components/common/NotificationInitializer';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import ScrollToTop from './components/utils/ScrollToTop';
import PageTracker from './components/utils/PageTracker';
import TokenHandler from './components/common/TokenHandler';
import { Toaster } from 'react-hot-toast';

import { NotificationProvider } from './context/NotificationContext';
import Notifications from './pages/Notifications';

import { AuthProvider } from './context/AuthContext';
import { SearchProvider } from './context/SearchContext';
import { WishlistProvider } from './context/WishlistContext';
import { CompareProvider } from './context/CompareContext';

import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import PropertyDetails from './pages/PropertyDetails';
import BookingPage from './pages/BookingPage';
import BookingDetails from './pages/BookingDetails';
import UserBookings from './pages/UserBookings';
import Profile from './pages/Profile';
import Wishlist from './pages/Wishlist';
import PublicPropertyCalendar from './pages/PublicPropertyCalendar';
import Contact from './pages/Contact';
import About from './pages/About';
import Policy from './pages/Policy';
import SetPassword from './pages/SetPassword';
import BookingSuccess from './pages/BookingSuccess';
import BookingFailed from './pages/BookingFailed';
import BookingPending from './pages/BookingPending';

import ErrorBoundary from './components/common/ErrorBoundary';
import CompareFloatingBar from './components/features/CompareFloatingBar';
import CompareModal from './components/features/CompareModal';
import ComingSoonGuard from './components/common/ComingSoonGuard';

import ChatWidget from './components/chat/ChatWidget';

function App() {
  // ... (existing useEffect)

  return (
    <ErrorBoundary>
      <AuthProvider>
        <SearchProvider>
          <WishlistProvider>
            <CompareProvider>
              <NotificationProvider> {/* Added Provider */}
                <BrowserRouter>
                  <ComingSoonGuard>
                    <ScrollToTop />
                    <PageTracker />
                    <TokenHandler />
                    <NotificationInitializer />
                    <Toaster position="top-center" />
                    <Routes>
                      <Route path="/" element={<MainLayout />}>
                        <Route index element={<Home />} />
                        <Route path="/notifications" element={<Notifications />} /> {/* Added Route */}
                        <Route path="/property/:id" element={<PropertyDetails />} />
                        {/* ... existing routes ... */}
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
