import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaHome, FaFileInvoice } from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function BookingSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const bookingId = searchParams.get('id');

    // Optional: confetti effect or fetch booking details

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center"
            >
                <div className="flex justify-center mb-6">
                    <FaCheckCircle className="text-green-500 text-6xl shadow-green-200 drop-shadow-lg" />
                </div>

                <h1 className="text-2xl font-black text-gray-900 mb-2">Booking Confirmed!</h1>
                <p className="text-gray-500 mb-8">
                    Thank you. Your payment was successful and your booking ID is <span className="font-mono font-bold text-black">#{bookingId}</span>.
                </p>

                <div className="space-y-3">
                    <button
                        onClick={() => navigate('/bookings')}
                        className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors flex items-center justify-center gap-2"
                    >
                        <FaFileInvoice /> View My Bookings
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
