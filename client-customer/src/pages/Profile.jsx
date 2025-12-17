import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-20">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Please Log In</h2>
                    <p className="text-gray-600 mb-6">You need to be logged in to view your profile.</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="bg-[#FF385C] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#d90b3e]"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="pt-32 pb-20 min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 max-w-2xl">
                <h1 className="text-3xl font-bold mb-8">My Profile</h1>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-8">
                        <div className="flex items-center gap-6 mb-8">
                            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-3xl font-bold text-gray-500 uppercase">
                                {user.name ? user.name.charAt(0) : 'U'}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">{user.name || 'Guest User'}</h2>
                                <p className="text-gray-500">{user.email || 'No email provided'}</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="border-b pb-4">
                                <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
                                <div className="text-lg font-medium">{user.name}</div>
                            </div>

                            <div className="border-b pb-4">
                                <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
                                <div className="text-lg font-medium">{user.email}</div>
                            </div>

                            <div className="border-b pb-4">
                                <label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
                                <div className="text-lg font-medium">{user.phone || 'Not provided'}</div>
                            </div>

                            <div className="pt-4">
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-center text-red-600 font-bold border border-red-200 py-3 rounded-lg hover:bg-red-50 transition"
                                >
                                    Log Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
