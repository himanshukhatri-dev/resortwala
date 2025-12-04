import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, LogOut, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Check if we are on the home page
  const isHome = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  // Dynamic classes based on scroll and page
  // Force solid background on all non-home pages
  const shouldUseSolidBg = scrolled || !isHome;

  const navClasses = `fixed top-0 w-full z-50 transition-all duration-300 ${shouldUseSolidBg
    ? 'bg-white/95 backdrop-blur-md shadow-md border-b border-gray-200 py-3'
    : 'bg-transparent py-4'
    }`;

  const textClasses = shouldUseSolidBg ? 'text-gray-700' : 'text-white';
  const logoClasses = shouldUseSolidBg ? 'text-rose-500' : 'text-white';
  const buttonClasses = shouldUseSolidBg
    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm';

  return (
    <nav className={navClasses}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className={`p-1.5 rounded-lg transform transition-transform group-hover:rotate-12 ${shouldUseSolidBg ? 'bg-rose-500' : 'bg-white'}`}>
              <img
                src="https://www.resortwala.com/favicon.ico"
                alt="ResortWala Logo"
                className="w-6 h-6 object-contain"
              />
            </div>
            <span className={`text-2xl font-bold ${logoClasses}`}>
              ResortWala
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/list-your-place"
              className={`font-medium px-4 py-2 rounded-full transition-colors ${textClasses} hover:bg-white/10`}
            >
              List your place
            </Link>
            {user ? (
              <div className="flex items-center gap-4">
                <Link
                  to="/dashboard"
                  className={`flex items-center gap-2 px-3 py-2 rounded-full transition-colors ${buttonClasses}`}
                >
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <User className={`w-5 h-5 ${textClasses}`} />
                  </div>
                  <span className={`font-medium ${textClasses}`}>{user.username || user.email}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className={`p-2 rounded-full transition-colors ${buttonClasses}`}
                  title="Logout"
                >
                  <LogOut className={`w-5 h-5 ${textClasses}`} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  to="/contact"
                  className={`font-medium px-4 py-2 rounded-full transition-colors ${textClasses} hover:bg-white/10`}
                >
                  Contact
                </Link>
                <Link
                  to="/login"
                  className={`font-medium px-4 py-2 rounded-full transition-colors ${textClasses} hover:bg-white/10`}
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white px-6 py-2 rounded-full font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`p-2 rounded-md focus:outline-none ${textClasses}`}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100 overflow-hidden shadow-xl"
          >
            <div className="px-4 pt-2 pb-4 space-y-1">
              <Link
                to="/list-your-place"
                className="block px-3 py-3 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => setIsMenuOpen(false)}
              >
                List your place
              </Link>
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-2 px-3 py-3 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="w-5 h-5" />
                    Dashboard ({user.username || user.email})
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-3 rounded-lg text-base font-medium text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut className="w-5 h-5" />
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/contact"
                    className="block px-3 py-3 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Contact
                  </Link>
                  <Link
                    to="/login"
                    className="block px-3 py-3 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    className="block px-3 py-3 rounded-lg text-base font-medium text-rose-600 hover:bg-rose-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;