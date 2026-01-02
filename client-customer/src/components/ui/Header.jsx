import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaBars, FaUserCircle, FaHome } from 'react-icons/fa';

import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

import SearchBar from '../ui/SearchBar';

export default function Header({ onOpenSearch, onSearch, properties, categories, activeCategory, onCategoryChange }) {
    const location = useLocation();
    const { user, logout } = useAuth();
    const isHomePage = location.pathname === '/';
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 300); // Wait until hero is passed
        };
        window.addEventListener('scroll', handleScroll);
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    return (
        <header
            className={`fixed top-0 w-full z-50 transition-all duration-300 border-b pt-[env(safe-area-inset-top)] ${scrolled || !isHomePage
                ? 'bg-white border-gray-100 shadow-sm h-[calc(80px+env(safe-area-inset-top))]' // Revert to standard height, let contents fit
                : 'bg-white border-transparent h-[calc(80px+env(safe-area-inset-top))]'
                }`}
        >
            <div className="container mx-auto px-4 h-full flex items-center justify-between">
                {/* 1. LOGO */}
                <Link to="/" className="flex-shrink-0">
                    <img
                        src="/resortwala-logo.png"
                        alt="ResortWala"
                        className="h-9 md:h-10 w-auto object-contain"
                    />
                </Link>

                {/* 2. CENTER - SEARCH BAR (Sticky) */}
                <div className="hidden md:flex flex-1 justify-center px-8 transition-all duration-500">
                    <div className={`transition-all duration-500 transform ${scrolled || !isHomePage ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-10 opacity-0 scale-95 pointer-events-none'}`}>
                        <SearchBar
                            compact={true}
                            isSticky={true}
                            onSearch={onSearch} // Pass the handler from MainLayout
                            properties={properties}
                            categories={categories}
                        />
                    </div>
                </div>

                {/* 3. RIGHT - MENU */}
                <div className="flex items-center gap-4 relative" ref={menuRef}>
                    <a
                        href="/vendor/"
                        target="_self"
                        className="hidden lg:flex items-center gap-2 group"
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-pink-500 flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform">
                            <FaHome size={14} />
                        </div>
                        <span className="font-bold text-[11px] uppercase tracking-widest text-gray-700 group-hover:text-primary transition-colors">List your Property</span>
                    </a>


                    <div
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="flex items-center gap-2 border border-gray-200 bg-white rounded-full p-1.5 pl-3 hover:shadow-md transition cursor-pointer"
                    >
                        <FaBars className="text-gray-600" size={14} />
                        <div className="bg-gray-500 text-white rounded-full p-0.5 overflow-hidden">
                            {user ? (
                                <div className="w-7 h-7 flex items-center justify-center bg-black text-[10px] font-black rounded-full uppercase">
                                    {(user.name || user.Name || 'U').charAt(0)}
                                </div>
                            ) : (
                                <FaUserCircle size={26} className="text-gray-300 bg-white rounded-full" />
                            )}
                        </div>
                    </div>

                    {/* DROPDOWN MENU */}
                    <AnimatePresence>
                        {menuOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute top-14 right-0 w-64 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] py-2 border border-gray-100 overflow-hidden"
                            >
                                {user ? (
                                    <>
                                        <div className="px-5 py-4 border-b border-gray-50">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Logged in as</p>
                                            <p className="font-bold text-sm text-gray-900">{(user.name || user.Name)}</p>
                                        </div>
                                        <Link to="/profile" className="block px-5 py-3.5 hover:bg-gray-50 text-sm font-bold text-gray-700 transition-colors">Personal Profile</Link>
                                        <Link to="/bookings" className="block px-5 py-3.5 hover:bg-gray-50 text-sm font-bold text-gray-700 transition-colors">My Stays & Bookings</Link>
                                        <Link to="/wishlist" className="block px-5 py-3.5 hover:bg-gray-50 text-sm font-bold text-gray-700 transition-colors">My Wishlist</Link>
                                        <div className="border-t border-gray-50 my-1"></div>
                                        <button onClick={logout} className="block w-full text-left px-5 py-3.5 hover:bg-gray-50 text-sm text-red-500 font-bold">Log out</button>
                                    </>
                                ) : (
                                    <>
                                        <Link to="/login" className="block px-5 py-4 hover:bg-gray-50 text-sm font-black text-gray-900 uppercase tracking-widest">Login</Link>
                                        <Link to="/signup" className="block px-5 py-3 hover:bg-gray-50 text-sm font-medium text-gray-600">Signup</Link>
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
