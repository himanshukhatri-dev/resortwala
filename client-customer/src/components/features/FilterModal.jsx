import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import FilterSidebar from './FilterSidebar';

export default function FilterModal({ isOpen, onClose, filters, onFilterChange }) {
    if (!isOpen) return null;

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
                        className="fixed inset-0 bg-black/50 z-50 lg:hidden backdrop-blur-sm"
                    />

                    {/* Bottom Sheet */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 h-[85vh] bg-white z-[60] lg:hidden rounded-t-3xl shadow-2xl overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white sticky top-0 z-10">
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Filters</h3>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200"
                            >
                                <FaTimes size={14} />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6 bg-white pb-32">
                            <FilterSidebar filters={filters} onFilterChange={onFilterChange} />
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 border-t border-gray-100 bg-white absolute bottom-0 left-0 right-0">
                            <button
                                onClick={onClose}
                                className="w-full bg-black text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-transform"
                            >
                                Show Results
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
