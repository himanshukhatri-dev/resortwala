import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FaClock, FaHome, FaFileInvoice } from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function BookingPending() {
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
                    <FaClock className="text-amber-500 text-6xl drop-shadow-lg animate-pulse" />
                </div>

                <h1 className="text-2xl font-black text-gray-900 mb-2">Payment On Hold</h1>
                <p className="text-gray-500 mb-4">
                    Your payment status is currently <span className="font-bold text-amber-600">PENDING Verification</span>.
                </p>
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-left mb-8">
                    <p className="text-sm text-amber-800 leading-relaxed">
                        Don't worry! This usually happens due to bank delays. Your booking ID is <strong>#{bookingId}</strong>.
                        We will update your booking status once the payment is confirmed (usually within 5-10 minutes).
                    </p>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={() => navigate('/bookings')}
                        className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors flex items-center justify-center gap-2"
                    >
                        <FaFileInvoice /> Check Booking Status
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
