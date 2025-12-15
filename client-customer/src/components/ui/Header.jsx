import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaBars, FaUserCircle, FaSearch } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

export default function Header() {
    const location = useLocation();
    const { user, logout } = useAuth();
    const isHomePage = location.pathname === '/';
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            if (isHomePage) {
                setScrolled(window.scrollY > 50);
            } else {
                setScrolled(true);
            }
        };

        if (isHomePage) {
            window.addEventListener('scroll', handleScroll);
            handleScroll();
        } else {
            setScrolled(true);
        }

        return () => window.removeEventListener('scroll', handleScroll);
    }, [isHomePage]);

    // Click outside to close menu
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        };

        if (menuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [menuOpen]);

    return (
        <header
            className={`fixed top-0 w-full z-30 transition-all duration-300 pointer-events-none ${scrolled || !isHomePage ? 'bg-white shadow-sm h-[120px]' : 'bg-transparent h-[100px]'
                }`}
        >
            <div className="container mx-auto px-4 h-full flex items-center justify-between relative pointer-events-auto">

                {/* 1. LOGO */}
                <Link to="/" className="flex-shrink-0 z-20">
                    <img
                        src="/resortwala-logo.png"
                        alt="ResortWala"
                        className={`transition-all duration-300 ${scrolled || !isHomePage ? 'h-10' : 'h-12'
                            } w-auto object-contain`}
                    />
                </Link>

                {/* 2. CENTER - SPACER (For future use or just empty to keep layout balanced) */}
                <div className="hidden md:block w-full max-w-md"></div>

                {/* 3. RIGHT - MENU */}
                <div className="flex items-center gap-4 z-20 relative" ref={menuRef}>
                    <a
                        href={import.meta.env.VITE_VENDOR_URL || "http://stagingvendor.resortwala.com"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`hidden md:block font-medium text-sm hover:bg-white/10 px-4 py-2 rounded-full transition cursor-pointer ${scrolled || !isHomePage ? 'text-gray-900 hover:bg-gray-100' : 'text-white'}`}
                    >
                        List your property
                    </a>
                    <div
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="flex items-center gap-2 border border-gray-300 bg-white rounded-full p-1 pl-3 hover:shadow-md transition cursor-pointer relative"
                    >
                        <FaBars className="text-gray-600" size={16} />
                        <div className="bg-gray-500 text-white rounded-full p-1 overflow-hidden">
                            {user ? (
                                <div className="w-6 h-6 flex items-center justify-center bg-black text-[10px] font-bold rounded-full">
                                    {(user.name || user.Name || 'U').charAt(0).toUpperCase()}
                                </div>
                            ) : (
                                <FaUserCircle size={24} className="text-gray-400 bg-white rounded-full" />
                            )}
                        </div>
                    </div>

                    {/* DROPDOWN MENU */}
                    <AnimatePresence>
                        {menuOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute top-14 right-0 w-64 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] py-2 border border-gray-100 overflow-hidden"
                            >
                                {user ? (
                                    <>
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <p className="font-semibold text-sm">Hi, {(user.name || user.Name)}</p>
                                        </div>
                                        <Link to="/profile" className="block px-4 py-3 hover:bg-gray-50 text-sm font-medium text-gray-700">Profile</Link>
                                        <Link to="/bookings" className="block px-4 py-3 hover:bg-gray-50 text-sm font-medium text-gray-700">My Bookings</Link>
                                        <div className="border-t border-gray-100 my-1"></div>
                                        <button onClick={logout} className="block w-full text-left px-4 py-3 hover:bg-gray-50 text-sm text-gray-700">Log out</button>
                                    </>
                                ) : (
                                    <>
                                        <Link to="/login" className="block px-4 py-3 hover:bg-gray-50 text-sm font-bold text-gray-800">Log in</Link>
                                        <Link to="/signup" className="block px-4 py-3 hover:bg-gray-50 text-sm font-medium text-gray-700">Sign up</Link>
                                        <div className="border-t border-gray-100 my-1"></div>
                                        <Link to="/contact" className="block px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 cursor-pointer">Contact Us</Link>
                                        <div className="px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 cursor-pointer">Help Center</div>
                                    </>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
}
