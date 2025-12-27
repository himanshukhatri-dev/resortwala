import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { FaCheckCircle, FaSpinner } from 'react-icons/fa';

export default function PaymentSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const transactionId = searchParams.get('merchantTransactionId');
    const [status, setStatus] = useState('verifying'); // verifying, success, failed

    useEffect(() => {
        if (!transactionId) {
            setStatus('failed');
            return;
        }

        const verifyPayment = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/customer/payment/phonepe/status/${transactionId}`);
                if (response.data.success && response.data.code === 'PAYMENT_SUCCESS') {
                    setStatus('success');
                } else {
                    setStatus('failed');
                }
            } catch (error) {
                console.error("Payment Verification Failed", error);
                setStatus('failed');
            }
        };

        verifyPayment();
    }, [transactionId]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                {status === 'verifying' && (
                    <div className="flex flex-col items-center">
                        <FaSpinner className="animate-spin text-4xl text-blue-500 mb-4" />
                        <h2 className="text-xl font-bold text-gray-800">Verifying Payment...</h2>
                        <p className="text-gray-500 mt-2">Please do not refresh the page.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center">
                        <FaCheckCircle className="text-6xl text-green-500 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800">Payment Successful!</h2>
                        <p className="text-gray-500 mt-2">Your booking has been confirmed.</p>
                        <p className="text-sm text-gray-400 mt-4">Transaction ID: {transactionId}</p>

                        <button
                            onClick={() => navigate('/bookings')}
                            className="mt-8 bg-black text-white px-6 py-3 rounded-xl font-medium w-full hover:bg-gray-800 transition"
                        >
                            View Bookings
                        </button>
                    </div>
                )}

                {status === 'failed' && (
                    <div className="flex flex-col items-center">
                        <div className="text-6xl mb-4">❌</div>
                        <h2 className="text-2xl font-bold text-gray-800">Payment Failed</h2>
                        <p className="text-gray-500 mt-2">We couldn't verify your payment. If money was deducted, it will be refunded automatically.</p>

                        <button
                            onClick={() => navigate('/')}
                            className="mt-8 border border-gray-300 text-black px-6 py-3 rounded-xl font-medium w-full hover:bg-gray-50 transition"
                        >
                            Go to Home
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
