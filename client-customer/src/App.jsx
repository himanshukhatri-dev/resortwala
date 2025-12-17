import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import ScrollToTop from './components/utils/ScrollToTop';

import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';

import PropertyDetails from './pages/PropertyDetails';
import BookingPage from './pages/BookingPage';
import UserBookings from './pages/UserBookings';
import Contact from './pages/Contact';
import ErrorBoundary from './components/common/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
              {/* Added Route for Property Details */}
              <Route path="/property/:id" element={<PropertyDetails />} />
              <Route path="/book/:id" element={<BookingPage />} />
              <Route path="/bookings" element={<UserBookings />} />
              <Route path="/contact" element={<Contact />} />
            </Route>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
