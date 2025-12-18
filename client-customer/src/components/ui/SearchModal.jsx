import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import SearchBar from './SearchBar';

export default function SearchModal({ isOpen, onClose, ...searchBarProps }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4"
                    >
                        {/* Modal Content */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl relative"
                        >
                            {/* Header */}
                            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
                                <h3 className="text-xl font-bold text-gray-800 font-serif">Plan your getaway</h3>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                                >
                                    <FaTimes size={20} className="text-gray-500" />
                                </button>
                            </div>

                            {/* Search Bar Wrapper */}
                            <div className="p-6 md:p-10 bg-white">
                                <SearchBar
                                    {...searchBarProps}
                                    isSticky={false}
                                    compact={false}
                                />
                                <div className="mt-8 text-center text-sm text-gray-400">
                                    <p>Discover villas, resorts, and frames tailored for you.</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
