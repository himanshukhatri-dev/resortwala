import { useState, useEffect, useRef } from 'react';
import { FaBell, FaCalendarCheck, FaHome, FaEdit, FaArrowRight, FaExclamationCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

export default function NotificationBell() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState({
        pendingBookings: [],
        properties: [],
        changeRequests: [],
        total: 0
    });
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (token) {
            fetchNotifications();
            // Auto-refresh every 30 seconds
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [token]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const headers = { Authorization: `Bearer ${token}` };

            const [bookingsRes, propertiesRes, changesRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/vendor/bookings`, { headers }),
                axios.get(`${API_BASE_URL}/vendor/properties`, { headers }),
                axios.get(`${API_BASE_URL}/vendor/property-changes`, { headers }).catch(() => ({ data: [] }))
            ]);

            // Filter pending bookings
            const pendingBookings = (bookingsRes.data || []).filter(b =>
                b.Status?.toLowerCase() === 'pending'
            );

            // Filter pending properties
            const pendingProperties = (propertiesRes.data || []).filter(p =>
                p.Status?.toLowerCase() === 'pending'
            );

            // Filter pending change requests
            const pendingChanges = (changesRes.data || []).filter(c =>
                c.status?.toLowerCase() === 'pending'
            );

            setNotifications({
                pendingBookings,
                properties: pendingProperties,
                changeRequests: pendingChanges,
                total: pendingBookings.length + pendingProperties.length + pendingChanges.length
            });
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNavigate = (path) => {
        navigate(path);
        setIsOpen(false);
    };

    const { pendingBookings, properties, changeRequests, total } = notifications;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-3 rounded-full hover:bg-white/10 transition-all duration-200 bg-white/5 backdrop-blur-sm"
                title="Notifications"
            >
                <FaBell className="text-white text-xl" />
                {total > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg animate-pulse">
                        {total > 99 ? '99+' : total}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-slideDown">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4">
                        <h3 className="font-bold text-lg">Action Required</h3>
                        <p className="text-xs text-emerald-100 mt-1">
                            {total === 0 ? 'All caught up!' : `${total} item${total !== 1 ? 's' : ''} need${total === 1 ? 's' : ''} your attention`}
                        </p>
                    </div>

                    {/* Content */}
                    <div className="max-h-96 overflow-y-auto">
                        {total === 0 ? (
                            <div className="p-8 text-center">
                                <div className="text-6xl mb-4">✨</div>
                                <p className="text-gray-500 font-medium">All caught up!</p>
                                <p className="text-gray-400 text-sm mt-1">No pending actions at the moment.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {/* Pending Bookings */}
                                {pendingBookings.length > 0 && (
                                    <div className="p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                                    <FaCalendarCheck className="text-orange-600 text-sm" />
                                                </div>
                                                <span className="font-bold text-gray-800 text-sm">Pending Bookings</span>
                                                <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-bold">
                                                    {pendingBookings.length}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleNavigate('/bookings')}
                                                className="text-emerald-600 hover:text-emerald-700 text-xs font-bold flex items-center gap-1"
                                            >
                                                View All <FaArrowRight className="text-[10px]" />
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {pendingBookings.slice(0, 3).map(booking => (
                                                <div
                                                    key={booking.BookingId}
                                                    onClick={() => handleNavigate('/bookings')}
                                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white cursor-pointer transition-all"
                                                >
                                                    <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                                                        {booking.CustomerName?.charAt(0) || 'B'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-gray-800 text-sm truncate">{booking.CustomerName}</p>
                                                        <p className="text-xs text-gray-500 truncate">
                                                            {new Date(booking.CheckInDate).toLocaleDateString()} • ₹{booking.TotalAmount}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Pending Properties */}
                                {properties.length > 0 && (
                                    <div className="p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                                    <FaHome className="text-blue-600 text-sm" />
                                                </div>
                                                <span className="font-bold text-gray-800 text-sm">Property Approvals</span>
                                                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">
                                                    {properties.length}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleNavigate('/properties')}
                                                className="text-emerald-600 hover:text-emerald-700 text-xs font-bold flex items-center gap-1"
                                            >
                                                View All <FaArrowRight className="text-[10px]" />
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {properties.slice(0, 3).map(prop => (
                                                <div
                                                    key={prop.PropertyId}
                                                    onClick={() => handleNavigate('/properties')}
                                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white cursor-pointer transition-all"
                                                >
                                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                                                        <FaHome />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-gray-800 text-sm truncate">{prop.Name}</p>
                                                        <p className="text-xs text-gray-500 truncate">Awaiting admin approval</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Change Requests */}
                                {changeRequests.length > 0 && (
                                    <div className="p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                                    <FaEdit className="text-purple-600 text-sm" />
                                                </div>
                                                <span className="font-bold text-gray-800 text-sm">Change Requests</span>
                                                <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-bold">
                                                    {changeRequests.length}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            {changeRequests.slice(0, 3).map(req => (
                                                <div
                                                    key={req.id}
                                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white cursor-pointer transition-all"
                                                >
                                                    <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                                                        <FaExclamationCircle />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-gray-800 text-sm truncate">{req.property_name}</p>
                                                        <p className="text-xs text-gray-500 truncate">Pending admin review</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {total > 0 && (
                        <div className="p-4 bg-gray-50 border-t border-gray-100">
                            <button
                                onClick={() => handleNavigate('/dashboard')}
                                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-2.5 rounded-xl font-bold text-sm hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg shadow-emerald-200"
                            >
                                View Dashboard
                            </button>
                        </div>
                    )}
                </div>
            )}

            <style>{`
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-slideDown {
                    animation: slideDown 0.2s ease-out;
                }
            `}</style>
        </div>
    );
}
