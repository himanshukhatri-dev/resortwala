import { useState, useEffect, useRef } from 'react';
import { FaBell, FaUsers, FaHome, FaEdit, FaArrowRight } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

export default function NotificationBell() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState({
        vendors: [],
        properties: [],
        changes: [],
        total: 0
    });
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (token) {
            fetchNotifications();
            // Auto-refresh every 5 seconds (Live updates)
            // const interval = setInterval(fetchNotifications, 5000);
            // return () => clearInterval(interval);
        }
    }, [token]);

    // ... (lines 30-44 unchanged)

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const headers = { Authorization: `Bearer ${token}` };

            const [vendorsRes, propsRes, changesRes, bookingsRes, holidaysRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/admin/vendors/pending`, { headers }),
                axios.get(`${API_BASE_URL}/admin/properties/pending`, { headers }),
                axios.get(`${API_BASE_URL}/admin/property-changes`, { headers }),
                axios.get(`${API_BASE_URL}/admin/bookings`, { headers }),
                axios.get(`${API_BASE_URL}/admin/holidays/pending`, { headers }) // New endpoint
            ]);

            const vendors = vendorsRes.data || [];
            const properties = propsRes.data || [];
            const changes = (changesRes.data || []).filter(c => c.status === 'pending');
            const bookings = (bookingsRes.data || []).filter(b => b.Status?.toLowerCase() === 'pending');
            const holidays = holidaysRes.data || [];

            setNotifications({
                vendors,
                properties,
                changes,
                bookings,
                holidays, // Store holidays
                total: vendors.length + properties.length + changes.length + bookings.length + holidays.length
            });
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNavigate = (path, state = {}) => {
        navigate(path, { state });
        setIsOpen(false);
    };

    const { vendors, properties, changes, bookings, total } = notifications;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-3 rounded-full hover:bg-gray-100 transition-all duration-200"
                title="Notifications"
            >
                <FaBell className="text-gray-700 text-xl" />
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
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
                        <h3 className="font-bold text-lg">Pending Actions</h3>
                        <p className="text-xs text-blue-100 mt-1">
                            {total === 0 ? 'All caught up!' : `${total} item${total !== 1 ? 's' : ''} need${total === 1 ? 's' : ''} attention`}
                        </p>
                    </div>

                    {/* Content */}
                    <div className="max-h-96 overflow-y-auto">
                        {total === 0 ? (
                            <div className="p-8 text-center">
                                <div className="text-6xl mb-4">🎉</div>
                                <p className="text-gray-500 font-medium">All caught up!</p>
                                <p className="text-gray-400 text-sm mt-1">No pending actions at the moment.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {/* Pending Bookings */}
                                {bookings && bookings.length > 0 && (
                                    <div className="p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                                    <FaBell className="text-green-600 text-sm" />
                                                </div>
                                                <span className="font-bold text-gray-800 text-sm">Booking Requests</span>
                                                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">
                                                    {bookings.length}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleNavigate('/calendar')}
                                                className="text-blue-600 hover:text-blue-700 text-xs font-bold flex items-center gap-1"
                                            >
                                                View All <FaArrowRight className="text-[10px]" />
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {bookings.slice(0, 3).map(b => (
                                                <div
                                                    key={b.BookingId}
                                                    onClick={() => handleNavigate('/calendar', { bookingId: b.BookingId })}
                                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white cursor-pointer transition-all"
                                                >
                                                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                                                        {b.CustomerName?.charAt(0) || 'B'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-gray-800 text-sm truncate">{b.CustomerName}</p>
                                                        <p className="text-xs text-gray-500 truncate">{b.property?.Name || 'Property'}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Pending Vendors */}
                                {vendors.length > 0 && (
                                    <div className="p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                                                    <FaUsers className="text-amber-600 text-sm" />
                                                </div>
                                                <span className="font-bold text-gray-800 text-sm">Vendor Approvals</span>
                                                <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-bold">
                                                    {vendors.length}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleNavigate('/vendors')}
                                                className="text-blue-600 hover:text-blue-700 text-xs font-bold flex items-center gap-1"
                                            >
                                                View All <FaArrowRight className="text-[10px]" />
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {vendors.slice(0, 3).map(vendor => (
                                                <div
                                                    key={vendor.id}
                                                    onClick={() => handleNavigate(`/vendors/${vendor.id}`)}
                                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white cursor-pointer transition-all"
                                                >
                                                    <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                                                        {vendor.name?.charAt(0)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-gray-800 text-sm truncate">{vendor.name}</p>
                                                        <p className="text-xs text-gray-500 truncate">{vendor.business_name || vendor.email}</p>
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
                                                className="text-blue-600 hover:text-blue-700 text-xs font-bold flex items-center gap-1"
                                            >
                                                View All <FaArrowRight className="text-[10px]" />
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {properties.slice(0, 3).map(prop => (
                                                <div
                                                    key={prop.PropertyId}
                                                    onClick={() => handleNavigate(`/properties/${prop.PropertyId}/approve`)}
                                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white cursor-pointer transition-all"
                                                >
                                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                                                        P
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-gray-800 text-sm truncate">{prop.Name}</p>
                                                        <p className="text-xs text-gray-500 truncate">{prop.Location} • ₹{prop.Price}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Change Requests */}
                                {changes.length > 0 && (
                                    <div className="p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                                                    <FaEdit className="text-violet-600 text-sm" />
                                                </div>
                                                <span className="font-bold text-gray-800 text-sm">Change Requests</span>
                                                <span className="bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full text-xs font-bold">
                                                    {changes.length}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleNavigate('/property-changes')}
                                                className="text-blue-600 hover:text-blue-700 text-xs font-bold flex items-center gap-1"
                                            >
                                                View All <FaArrowRight className="text-[10px]" />
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {changes.slice(0, 3).map(req => (
                                                <div
                                                    key={req.id}
                                                    onClick={() => handleNavigate(`/properties/${req.property_id}/changes/${req.id}`)}
                                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white cursor-pointer transition-all"
                                                >
                                                    <div className="w-8 h-8 bg-gradient-to-br from-violet-400 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                                                        <FaEdit />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-gray-800 text-sm truncate">{req.property_name}</p>
                                                        <p className="text-xs text-gray-500 truncate">By: {req.vendor_name || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Pending Holidays - NEW SECTION */}
                        {notifications.holidays && notifications.holidays.length > 0 && (
                            <div className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                                            <FaEdit className="text-pink-600 text-sm" />
                                        </div>
                                        <span className="font-bold text-gray-800 text-sm">Holiday Rates</span>
                                        <span className="bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full text-xs font-bold">
                                            {notifications.holidays.length}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleNavigate('/approvals/holidays')}
                                        className="text-blue-600 hover:text-blue-700 text-xs font-bold flex items-center gap-1"
                                    >
                                        View All <FaArrowRight className="text-[10px]" />
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {notifications.holidays.slice(0, 3).map(h => (
                                        <div
                                            key={h.id}
                                            onClick={() => handleNavigate('/approvals/holidays')}
                                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-white cursor-pointer transition-all"
                                        >
                                            <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-rose-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                                                ₹
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-800 text-sm truncate">{h.property?.Name || 'Property'}</p>
                                                <p className="text-xs text-gray-500 truncate">Rate Update: ₹{h.base_price}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>


                    {/* Footer */}
                    {total > 0 && (
                        <div className="p-4 bg-gray-50 border-t border-gray-100">
                            <button
                                onClick={() => handleNavigate('/dashboard')}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 rounded-xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200"
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
