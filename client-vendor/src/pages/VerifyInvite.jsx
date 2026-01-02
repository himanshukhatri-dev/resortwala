import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';

export default function VerifyInvite() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();
    const token = searchParams.get('token');

    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('Verifying your invitation...');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid verification link.');
            return;
        }

        const verifyToken = async () => {
            try {
                const response = await axios.post(`${API_BASE_URL}/onboard/complete`, { token });

                // Login the user
                login(response.data.token, response.data.user);

                setStatus('success');
                setMessage('Verification successful! Redirecting...');

                // Redirect to dashboard
                setTimeout(() => {
                    navigate('/dashboard');
                }, 1500);

            } catch (error) {
                console.error("Verification failed:", error);
                setStatus('error');
                setMessage(error.response?.data?.message || 'Verification failed. Link may be expired or used.');
            }
        };

        verifyToken();
    }, [token, login, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
                {status === 'verifying' && (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <h2 className="text-xl font-bold text-gray-800">Verifying...</h2>
                        <p className="text-gray-500 mt-2">{message}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center animate-fade-in">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 text-3xl">✓</div>
                        <h2 className="text-xl font-bold text-gray-800">Verified!</h2>
                        <p className="text-green-600 mt-2">{message}</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center animate-shake">
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 text-3xl">!</div>
                        <h2 className="text-xl font-bold text-gray-800">Verification Failed</h2>
                        <p className="text-red-600 mt-2">{message}</p>
                        <button
                            onClick={() => navigate('/login')}
                            className="mt-6 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
                        >
                            Go to Login
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
