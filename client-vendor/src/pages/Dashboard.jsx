import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useModal } from '../context/ModalContext';
import CalendarSelectorModal from '../components/CalendarSelectorModal';
import { FaHome, FaCheckCircle, FaCalendarCheck, FaRupeeSign, FaEye, FaMousePointer } from 'react-icons/fa';


// Mock data removed in favor of real API data

export default function Dashboard() {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCalendarModal, setShowCalendarModal] = useState(false);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/vendor/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const { showConfirm, showSuccess, showError } = useModal();
    const handleStatusUpdate = async (bookingId, newStatus) => {
        // ... (Keep existing logic, omitted for brevity if unchanged, but putting back full for consistency)
        const confirmed = await showConfirm(
            'Update Status',
            `Are you sure you want to ${newStatus} this booking?`,
            'Yes, Update',
            'Cancel',
            newStatus === 'rejected' ? 'danger' : 'confirm'
        );

        if (!confirmed) return;

        try {
            await axios.post(`${API_BASE_URL}/vendor/bookings/${bookingId}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchStats();
            await showSuccess('Status Updated', `Booking ${newStatus} successfully!`);
        } catch (error) {
            console.error('Error updating status:', error);
            showError('Update Failed', 'Failed to update booking status');
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center text-gray-500 font-medium">Loading Dashboard...</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up pb-20">
            {/* Header / Welcome Section */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Welcome back, {user?.name?.split(' ')[0] || 'Partner'}! (v2.0) 👋</h1>
                    <p className="text-gray-500 mt-2 text-lg font-medium">Here's how your business is performing today.</p>
                </div>
                <div className="text-right hidden md:block">
                    <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Today's Date</div>
                    <div className="text-xl font-bold text-gray-800">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                </div>
            </div>

            {/* Approval Alert */}
            {stats?.approval_status !== 'approved' && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-4">
                    <span className="text-2xl">⏳</span>
                    <div>
                        <h3 className="font-bold text-amber-800 text-lg">Account Pending Approval</h3>
                        <p className="text-amber-700">You can add properties, but they won't be live until an admin approves your account.</p>
                    </div>
                </div>
            )}

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Total Properties"
                    value={stats?.total_properties || 0}
                    icon={<FaHome />}
                    color="bg-blue-500"
                    trend="+1 this month"
                />
                <StatCard
                    label="Active Listings"
                    value={stats?.approved_properties || 0}
                    icon={<FaCheckCircle />}
                    color="bg-green-500"
                    trend="100% operational"
                />
                <StatCard
                    label="Total Bookings"
                    value={stats?.total_bookings || 0}
                    icon={<FaCalendarCheck />}
                    color="bg-purple-500"
                    trend="+5 this week"
                />
                <StatCard
                    label="Total Revenue"
                    value={`₹${stats?.total_revenue?.toLocaleString() || 0}`}
                    icon={<FaRupeeSign />}
                    color="bg-orange-500"
                    trend="+12% vs last month"
                />
            </div>

            {/* Operational Control & Quick Links Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Operational Control Center */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Control Panel */}
                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-100/50">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-extrabold text-gray-800">Operational Control</h3>
                                <p className="text-sm text-gray-500 mt-1">Manage your day-to-day operations efficiently</p>
                            </div>
                            <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-sm font-bold">Action Center</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Pending Actions */}
                            <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100 hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate('/bookings')}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="p-2 bg-orange-100 rounded-lg text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                        <FaCalendarCheck />
                                    </div>
                                    <span className="text-2xl font-bold text-gray-800">{stats?.pending_bookings || 0}</span>
                                </div>
                                <h4 className="font-bold text-gray-700">Pending Requests</h4>
                                <p className="text-xs text-gray-500 mt-1">Bookings waiting for your approval</p>
                            </div>

                            {/* Today's Arrivals */}
                            <div className="bg-green-50 rounded-2xl p-5 border border-green-100 hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate('/bookings')}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="p-2 bg-green-100 rounded-lg text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                                        <FaCheckCircle />
                                    </div>
                                    <span className="text-2xl font-bold text-gray-800">{stats?.todays_arrivals || 0}</span>
                                </div>
                                <h4 className="font-bold text-gray-700">Expected Arrivals</h4>
                                <p className="text-xs text-gray-500 mt-1">Guests checking in today</p>
                            </div>

                            {/* Property Health */}
                            <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100 hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate('/properties')}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <FaHome />
                                    </div>
                                    <span className="text-lg font-bold text-gray-800">{stats?.active_properties || 0}/{stats?.total_properties || 0}</span>
                                </div>
                                <h4 className="font-bold text-gray-700">Property Status</h4>
                                <p className="text-xs text-gray-500 mt-1">Active properties currently listed</p>
                            </div>

                            {/* Reviews Action */}
                            <div className="bg-purple-50 rounded-2xl p-5 border border-purple-100 hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate('/reviews')}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                        <FaEye />
                                    </div>
                                    <span className="text-lg font-bold text-gray-800">New</span>
                                </div>
                                <h4 className="font-bold text-gray-700">Guest Reviews</h4>
                                <p className="text-xs text-gray-500 mt-1">Check recent feedback</p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Access Links */}
                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-100/50">
                        <h3 className="text-xl font-extrabold text-gray-800 mb-6">Quick Access</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <button onClick={() => navigate('/properties/add')} className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all group">
                                <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">➕</span>
                                <span className="font-bold text-gray-600 text-sm group-hover:text-blue-600">Add Property</span>
                            </button>
                            <button onClick={() => navigate('/calendar')} className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-all group">
                                <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">🗓️</span>
                                <span className="font-bold text-gray-600 text-sm">Calendar</span>
                            </button>
                            <button onClick={() => navigate('/holiday-management')} className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-all group">
                                <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">🌴</span>
                                <span className="font-bold text-gray-600 text-sm">Holidays</span>
                            </button>
                            <button onClick={() => setShowCalendarModal(true)} className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-all group">
                                <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">⚡</span>
                                <span className="font-bold text-gray-600 text-sm">Quick Block</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Insights / Tips */}
                <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl p-8 text-white flex flex-col justify-between shadow-2xl h-full">
                    <div>
                        <h3 className="text-2xl font-bold mb-4 text-white">Boost Your Reach 🚀</h3>
                        <p className="text-indigo-200 mb-6 leading-relaxed text-white/90">
                            Properties with high-quality images and amenities lists get <strong className="text-white">3x more bookings</strong>. Update your listings to stand out!
                        </p>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3 text-sm font-medium text-indigo-100">
                                <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">📸</span>
                                Add 10+ Photos
                            </li>
                            <li className="flex items-center gap-3 text-sm font-medium text-indigo-100">
                                <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">🏷️</span>
                                Offer Weekend Deals
                            </li>
                        </ul>
                    </div>
                    <button onClick={() => navigate('/properties')} className="mt-8 bg-white text-indigo-900 font-bold py-3 px-6 rounded-xl hover:bg-indigo-50 transition w-full shadow-lg">
                        Optimize Properties
                    </button>
                </div>
            </div>

            {/* Quick Actions & Recent Bookings (Keeping simplified) */}
            <div className="grid grid-cols-1 gap-6">
                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-lg">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-800">Recent Activity</h3>
                        <button onClick={() => navigate('/bookings')} className="text-primary font-bold hover:underline">View All</button>
                    </div>
                    {stats?.recent_bookings?.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100">
                                        <th className="pb-4">Booking ID</th>
                                        <th className="pb-4">Property</th>
                                        <th className="pb-4">Customer</th>
                                        <th className="pb-4">Date</th>
                                        <th className="pb-4">Status</th>
                                        <th className="pb-4">Amount</th>
                                        <th className="pb-4">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.recent_bookings.map(b => (
                                        <tr key={b.BookingId} className="border-b border-gray-50 hover:bg-gray-50/50 transition bg-white">
                                            <td className="py-4 font-bold text-gray-700">#{b.BookingId}</td>
                                            <td className="py-4">
                                                <div className="font-bold text-gray-800">{b.property?.Name}</div>
                                                <div className="text-xs text-gray-500">{b.property?.Location}</div>
                                            </td>
                                            <td className="py-4">
                                                <div className="font-bold text-gray-800">{b.CustomerName}</div>
                                                <div className="text-xs text-gray-500">{b.CustomerMobile}</div>
                                            </td>
                                            <td className="py-4 text-sm text-gray-600">
                                                {new Date(b.CheckInDate).toLocaleDateString()}
                                            </td>
                                            <td className="py-4">
                                                <StatusBadge status={b.Status} />
                                            </td>
                                            <td className="py-4 font-bold">₹{b.TotalAmount}</td>
                                            <td className="py-4">
                                                {(!b.Status || b.Status === 'pending') && (
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleStatusUpdate(b.BookingId, 'confirmed')} className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition">✓</button>
                                                        <button onClick={() => handleStatusUpdate(b.BookingId, 'rejected')} className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition">✕</button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-400">No recent bookings</div>
                    )}
                </div>
            </div>

            <CalendarSelectorModal isOpen={showCalendarModal} onClose={() => setShowCalendarModal(false)} />

            <style>{`
                @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; }
            `}</style>
        </div >
    );
}

// Helper Components
const StatCard = ({ label, value, icon, color, trend }) => (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl shadow-gray-100/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-5xl text-black`}>{icon}</div>
        <div className="relative z-10">
            <div className={`w-12 h-12 rounded-2xl ${color} text-white flex items-center justify-center text-xl shadow-lg mb-4`}>
                {icon}
            </div>
            <p className="text-gray-500 font-medium text-sm mb-1">{label}</p>
            <h3 className="text-3xl font-extrabold text-gray-800 tracking-tight">{value}</h3>
            {trend && <p className="text-xs font-bold text-green-500 mt-2 bg-green-50 inline-block px-2 py-1 rounded-full">{trend}</p>}
        </div>
    </div>
);

const StatusBadge = ({ status }) => {
    let styles = "bg-gray-100 text-gray-600";
    if (status === 'confirmed') styles = "bg-green-100 text-green-700 border border-green-200";
    if (status === 'pending') styles = "bg-yellow-100 text-yellow-700 border border-yellow-200";
    if (status === 'cancelled') styles = "bg-red-50 text-red-600 border border-red-100";

    return <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${styles}`}>{status || 'Pending'}</span>;
};
