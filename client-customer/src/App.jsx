import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NotificationInitializer from './components/common/NotificationInitializer';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import ScrollToTop from './components/utils/ScrollToTop';
import PageTracker from './components/utils/PageTracker';
import TokenHandler from './components/common/TokenHandler';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import { SearchProvider } from './context/SearchContext';
import { WishlistProvider } from './context/WishlistContext';
import { CompareProvider } from './context/CompareContext';

import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import PropertyDetails from './pages/PropertyDetails';
import BookingSuccess from './pages/BookingSuccess';
import BookingFailed from './pages/BookingFailed';

// ... (in Routes)

                    <Route path="/bookings" element={<UserBookings />} />
                    <Route path="/booking/success" element={<BookingSuccess />} />
                    <Route path="/booking/failed" element={<BookingFailed />} />
                    <Route path="/wishlist" element={<Wishlist />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/policy/:type" element={<Policy />} />
                  </Route >

  {/* Public Standalone Calendar View */ }
  < Route path = "/stay/:uuid" element = {< PublicPropertyCalendar />} />

    < Route path = "/login" element = {< Login />} />
      < Route path = "/signup" element = {< Signup />} />
        < Route path = "/forgot-password" element = {< ForgotPassword />} />
          < Route path = "/set-password" element = {< SetPassword />} />
                </Routes >

  {/* Global Floating Bar & Modal */ }
  < CompareFloatingBar />
  <CompareModal />

              </BrowserRouter >
            </CompareProvider >
          </WishlistProvider >
        </SearchProvider >
      </AuthProvider >
    </ErrorBoundary >
  );
}

export default App;
