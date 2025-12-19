import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import ScrollToTop from './components/utils/ScrollToTop';
import TokenHandler from './components/common/TokenHandler';

import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import Login from './pages/Login';
import Signup from './pages/Signup';

import PropertyDetails from './pages/PropertyDetails';
import BookingPage from './pages/BookingPage';
import UserBookings from './pages/UserBookings';
import Profile from './pages/Profile';
import Wishlist from './pages/Wishlist';
import PublicPropertyCalendar from './pages/PublicPropertyCalendar';
import Contact from './pages/Contact';
import ErrorBoundary from './components/common/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <WishlistProvider>
          <BrowserRouter>
            <ScrollToTop />
            <TokenHandler />
            <Routes>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Home />} />
                {/* Added Route for Property Details */}
                <Route path="/property/:id" element={<PropertyDetails />} />
                <Route path="/book/:id" element={<BookingPage />} />
                <Route path="/bookings" element={<UserBookings />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/contact" element={<Contact />} />
              </Route>

              {/* Public Standalone Calendar View */}
              <Route path="/stay/:uuid" element={<PublicPropertyCalendar />} />

              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
            </Routes>
          </BrowserRouter>
        </WishlistProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
