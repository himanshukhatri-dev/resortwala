import React from 'react';
import { useCompare } from '../../context/CompareContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaExchangeAlt, FaArrowRight } from 'react-icons/fa';

export default function CompareFloatingBar() {
    const { compareList, removeFromCompare, clearCompare, openCompareModal } = useCompare();

    if (compareList.length === 0) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-6 flex justify-center pointer-events-none"
            >
                <div className="bg-white/90 backdrop-blur-xl border border-gray-200 shadow-2xl rounded-2xl p-3 pl-5 md:min-w-[400px] pointer-events-auto flex items-center justify-between gap-6">

                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-3">
                            {compareList.map((item) => (
                                <div key={item.id} className="relative group">
                                    <img
                                        src={item.image || "https://placewaifu.com/image/100/100"}
                                        alt={item.name}
                                        className="w-12 h-12 rounded-full border-2 border-white object-cover shadow-md"
                                    />
                                    <button
                                        onClick={() => removeFromCompare(item.id)}
                                        className="absolute -top-1 -right-1 bg-gray-900 text-white rounded-full p-0.5 w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-[8px]"
                                    >
                                        <FaTimes />
                                    </button>
                                </div>
                            ))}
                            {compareList.length < 3 && (
                                <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 bg-gray-50 text-[10px] font-bold">
                                    {compareList.length}/3
                                </div>
                            )}
                        </div>
                        <div className="hidden md:block">
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Compare</div>
                            <div className="text-sm font-bold text-gray-900">{compareList.length} properties selected</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={clearCompare}
                            className="text-gray-500 text-sm hover:text-red-500 underline decoration-gray-300 hover:decoration-red-200 font-medium px-2"
                        >
                            Clear
                        </button>
                        <button
                            onClick={openCompareModal}
                            disabled={compareList.length < 2}
                            className={`
                                flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all active:scale-95
                                ${compareList.length < 2
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-black text-white hover:bg-gray-800 hover:shadow-xl'
                                }
                            `}
                        >
                            Compare <FaArrowRight />
                        </button>
                    </div>

                </div>
            </motion.div>
        </AnimatePresence>
    );
}
