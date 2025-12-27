import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaExclamationCircle } from 'react-icons/fa';

export default function PaymentFailure() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                <FaExclamationCircle className="text-6xl text-red-500 mb-4 mx-auto" />
                <h2 className="text-2xl font-bold text-gray-800">Payment Failed</h2>
                <p className="text-gray-500 mt-2">Something went wrong with your transaction. Please try again.</p>

                <div className="flex flex-col gap-3 mt-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="bg-[#FF385C] text-white px-6 py-3 rounded-xl font-medium w-full hover:bg-[#d9324e] transition"
                    >
                        Try Again
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="text-gray-500 font-medium hover:text-black transition"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
}
