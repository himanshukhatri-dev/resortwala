import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FaTimesCircle, FaRedo, FaHome } from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function BookingFailed() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const bookingId = searchParams.get('id');

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center"
            >
                <div className="flex justify-center mb-6">
                    <FaTimesCircle className="text-red-500 text-6xl shadow-red-200 drop-shadow-lg" />
                </div>

                <h1 className="text-2xl font-black text-gray-900 mb-2">Payment Failed</h1>
                <p className="text-gray-500 mb-8">
                    We could not process your payment for booking <span className="font-mono font-bold text-black">#{bookingId}</span>. Please try again.
                </p>

                <div className="space-y-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full py-3 bg-[#FF385C] text-white rounded-xl font-bold hover:bg-[#d9324e] transition-colors flex items-center justify-center gap-2"
                    >
                        <FaRedo /> Try Again
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                    >
                        <FaHome /> Back to Home
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
