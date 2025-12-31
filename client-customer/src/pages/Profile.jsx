import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import axios from 'axios';
import VerificationModal from '../components/VerificationModal';
import { FaEdit, FaSave, FaTimes, FaCheckCircle, FaExclamationCircle, FaHeart } from 'react-icons/fa';

export default function Profile() {
    const { user, token, logout, setUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: ''
    });
    const [saving, setSaving] = useState(false);
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [verificationType, setVerificationType] = useState('email'); // 'email' or 'phone'
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || ''
            });
        }
    }, [user]);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const handleEdit = () => {
        setEditMode(true);
        setError('');
        setSuccess('');
    };

    const handleCancel = () => {
        setEditMode(false);
        setFormData({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || ''
        });
        setError('');
    };

    const handleSave = async () => {
        setError('');
        setSuccess('');
        setSaving(true);

        try {
            const response = await axios.put(
                `${API_BASE_URL}/customer/profile`,
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Update user context
            setUser(response.data.user);
            setSuccess('Profile updated successfully!');
            setEditMode(false);

            // Resume task if returnTo exists
            if (location.state?.returnTo) {
                setTimeout(() => {
                    navigate(location.state.returnTo, { state: location.state.bookingState });
                }, 1500);
            } else {
                // Clear success message after 3 seconds
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    // Auto-enable edit mode for new users redirected from login
    useEffect(() => {
        if (location.state?.isNew) {
            setEditMode(true);
        }
    }, [location.state]);

    const handleVerify = (type) => {
        setVerificationType(type);
        setShowVerificationModal(true);
    };

    const handleVerificationSuccess = () => {
        // Refresh user data
        axios.get(`${API_BASE_URL}/customer/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(res => {
            setUser(res.data);
        });
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
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">My Profile</h1>
                    {!editMode && (
                        <button
                            onClick={handleEdit}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            <FaEdit /> Edit Profile
                        </button>
                    )}
                </div>

                {/* Success Message */}
                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
                        <FaCheckCircle />
                        {success}
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
                        <FaExclamationCircle />
                        {error}
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-8">
                        {/* Profile Avatar */}
                        <div className="flex items-center gap-6 mb-8">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-3xl font-bold text-white uppercase">
                                {formData.name ? formData.name.charAt(0) : 'U'}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">{formData.name || 'Guest User'}</h2>
                                <p className="text-gray-500">{formData.email || 'No email provided'}</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Full Name */}
                            <div className="border-b pb-4">
                                <label className="block text-sm font-medium text-gray-500 mb-2">Full Name</label>
                                {editMode ? (
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                ) : (
                                    <div className="text-lg font-medium">{formData.name}</div>
                                )}
                            </div>

                            {/* Email Address */}
                            <div className="border-b pb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-gray-500">Email Address</label>
                                    {user.email_verified_at ? (
                                        <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                                            <FaCheckCircle /> Verified
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => handleVerify('email')}
                                            className="text-xs text-blue-600 hover:underline font-semibold"
                                        >
                                            Verify Email
                                        </button>
                                    )}
                                </div>
                                {editMode ? (
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                ) : (
                                    <div className="text-lg font-medium">{formData.email}</div>
                                )}
                            </div>

                            {/* Phone Number */}
                            <div className="border-b pb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-gray-500">Phone Number</label>
                                    {user.phone && user.phone_verified_at ? (
                                        <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                                            <FaCheckCircle /> Verified
                                        </span>
                                    ) : user.phone ? (
                                        <button
                                            onClick={() => handleVerify('phone')}
                                            className="text-xs text-blue-600 hover:underline font-semibold"
                                        >
                                            Verify Phone
                                        </button>
                                    ) : null}
                                </div>
                                {editMode ? (
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="Enter phone number"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                ) : (
                                    <div className="text-lg font-medium">{formData.phone || 'Not provided'}</div>
                                )}
                            </div>

                            {/* Wishlist Link */}
                            <a href="/wishlist" className="block border-b pb-4 group cursor-pointer">
                                <label className="block text-sm font-medium text-gray-500 mb-1 group-hover:text-primary transition-colors">Saved Properties</label>
                                <div className="text-lg font-medium flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <FaHeart className="text-red-500" />
                                        My Wishlist
                                    </span>
                                    <span className="text-gray-400 text-sm group-hover:translate-x-1 transition-transform">View &rarr;</span>
                                </div>
                            </a>

                            {/* Action Buttons */}
                            {editMode ? (
                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <FaSave /> {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        disabled={saving}
                                        className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-300 transition disabled:opacity-50"
                                    >
                                        <FaTimes /> Cancel
                                    </button>
                                </div>
                            ) : (
                                <div className="pt-4">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-center text-red-600 font-bold border border-red-200 py-3 rounded-lg hover:bg-red-50 transition"
                                    >
                                        Log Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Verification Modal */}
            {showVerificationModal && (
                <VerificationModal
                    type={verificationType}
                    onClose={() => setShowVerificationModal(false)}
                    onSuccess={handleVerificationSuccess}
                />
            )}
        </div>
    );
}
