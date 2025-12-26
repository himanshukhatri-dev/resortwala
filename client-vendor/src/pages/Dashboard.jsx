import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useModal } from '../context/ModalContext';
import CalendarSelectorModal from '../components/CalendarSelectorModal';
import { FaHome, FaCheckCircle, FaCalendarCheck, FaRupeeSign } from 'react-icons/fa';

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
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 animate-fade-in-up pb-20 px-3 md:px-0">
            {/* Header - Mobile Optimized */}
            <div className="flex flex-col gap-3 border-b border-gray-100 pb-4 md:pb-6">
                <div>
                    <h1 className="text-xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                        {(() => {
                            const hour = new Date().getHours();
                            if (hour < 12) return 'Good Morning';
                            if (hour < 18) return 'Good Afternoon';
                            return 'Good Evening';
                        })()}, {user?.name?.split(' ')[0]}
                        <span className="text-lg md:text-2xl">👋</span>
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm md:text-lg font-medium">Here is your daily activity overview.</p>
                </div>
            </div>

            {/* Approval Alert */}
            {stats?.approval_status !== 'approved' && (
                <div className="bg-amber-50 border border-amber-200 p-3 md:p-4 rounded-xl flex items-start gap-3 md:gap-4">
                    <span className="text-xl md:text-2xl">⏳</span>
                    <div>
                        <h3 className="font-bold text-amber-800 text-base md:text-lg">Account Pending Approval</h3>
                        <p className="text-amber-700 text-sm md:text-base">You can add properties, but they won't be live until an admin approves your account.</p>
                    </div>
                </div>
            )}

            {/* PRIORITY: Pending Actions - Moved to Top */}
            <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 border border-gray-100 shadow-xl shadow-gray-100/50">
                <div className="flex justify-between items-center mb-4 md:mb-6">
                    <h3 className="text-lg md:text-xl font-extrabold text-gray-800">Pending Actions</h3>
                    <button onClick={() => navigate('/bookings')} className="text-blue-600 text-xs md:text-sm font-bold hover:underline">View All</button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    <div className="bg-orange-50 rounded-xl md:rounded-2xl p-4 md:p-5 border border-orange-100 cursor-pointer hover:bg-orange-100 transition" onClick={() => navigate('/bookings')}>
                        <div className="text-2xl md:text-3xl font-bold text-orange-600 mb-1">{stats?.pending_bookings || 0}</div>
                        <div className="font-bold text-gray-700 text-sm md:text-base">Pending Bookings</div>
                        <div className="text-xs text-gray-500">Require your confirmation</div>
                    </div>
                    <div className="bg-green-50 rounded-xl md:rounded-2xl p-4 md:p-5 border border-green-100 cursor-pointer hover:bg-green-100 transition" onClick={() => navigate('/bookings')}>
                        <div className="text-2xl md:text-3xl font-bold text-green-600 mb-1">{stats?.todays_arrivals || 0}</div>
                        <div className="font-bold text-gray-700 text-sm md:text-base">Arrivals Today</div>
                        <div className="text-xs text-gray-500">Prepare for check-in</div>
                    </div>
                </div>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <ActionCard
                    title="Add Property"
                    icon={<span className="text-2xl md:text-3xl">➕</span>}
                    desc="List a new stay"
                    onClick={() => navigate('/properties/add')}
                    color="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                />
                <ActionCard
                    title="Bookings"
                    icon={<span className="text-2xl md:text-3xl">📅</span>}
                    desc="Manage reservations"
                    onClick={() => navigate('/bookings')}
                    color="bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700"
                />
                <ActionCard
                    title="Calendar"
                    icon={<span className="text-2xl md:text-3xl">🗓️</span>}
                    desc="Availability & Rates"
                    onClick={() => navigate('/calendar')}
                    color="bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                />
                <ActionCard
                    title="Holidays"
                    icon={<span className="text-2xl md:text-3xl">🌴</span>}
                    desc="Manage blocked dates"
                    onClick={() => navigate('/holiday-management')}
                    color="bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700"
                />
            </div>

            {/* Quick Booking Stats - Mobile Optimized */}
            <div className="grid grid-cols-3 gap-2 md:gap-4">
                <div className="bg-white p-3 md:p-4 rounded-lg md:rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
                    <div className="bg-blue-50 p-1.5 md:p-2 rounded-lg text-blue-500 text-base md:text-xl mb-1 md:mb-2">📅</div>
                    <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">Today</p>
                    <p className="text-lg md:text-2xl font-extrabold text-blue-600">{stats?.today_bookings || 0}</p>
                </div>
                <div className="bg-white p-3 md:p-4 rounded-lg md:rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
                    <div className="bg-purple-50 p-1.5 md:p-2 rounded-lg text-purple-500 text-base md:text-xl mb-1 md:mb-2">📊</div>
                    <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">Week</p>
                    <p className="text-lg md:text-2xl font-extrabold text-purple-600">{stats?.week_bookings || 0}</p>
                </div>
                <div className="bg-white p-3 md:p-4 rounded-lg md:rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
                    <div className="bg-green-50 p-1.5 md:p-2 rounded-lg text-green-500 text-base md:text-xl mb-1 md:mb-2">📈</div>
                    <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">Month</p>
                    <p className="text-lg md:text-2xl font-extrabold text-green-600">{stats?.month_bookings || 0}</p>
                </div>
            </div>

            {/* Main Stats - Single Line on Mobile */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                <StatCard
                    label="Total Properties"
                    value={stats?.total_properties || 0}
                    icon={<FaHome />}
                    color="bg-blue-500"
                    trend={stats?.total_properties > 0 ? "Active" : "Start Listing"}
                />
                <StatCard
                    label="Active Listings"
                    value={stats?.approved_properties || 0}
                    icon={<FaCheckCircle />}
                    color="bg-green-500"
                    trend="Operational"
                />
                <StatCard
                    label="Total Bookings"
                    value={stats?.total_bookings || 0}
                    icon={<FaCalendarCheck />}
                    color="bg-purple-500"
                    trend="All Time"
                />
                <StatCard
                    label="Total Revenue"
                    value={`₹${stats?.total_revenue?.toLocaleString() || 0}`}
                    icon={<FaRupeeSign />}
                    color="bg-orange-500"
                    trend="Earnings"
                />
            </div>

            {/* Boost Usage - Hidden on Mobile */}
            <div className="hidden lg:block">
                <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl p-8 text-white flex flex-col justify-between shadow-2xl">
                    <div>
                        <h3 className="text-2xl font-bold mb-4 text-white">Boost Usage 🚀</h3>
                        <p className="text-indigo-200 mb-6 leading-relaxed text-white/90">
                            Keep your calendar updated to avoid double bookings and improve ranking.
                        </p>
                    </div>
                    <button onClick={() => navigate('/calendar')} className="mt-4 bg-white text-indigo-900 font-bold py-3 px-6 rounded-xl hover:bg-indigo-50 transition w-full shadow-lg">
                        Update Calendar
                    </button>
                </div>
            </div>

            {/* Recent Activity - Mobile Optimized Table */}
            <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-8 border border-gray-100 shadow-lg">
                <div className="flex justify-between items-center mb-4 md:mb-6">
                    <h3 className="text-lg md:text-xl font-bold text-gray-800">Recent Activity</h3>
                    <button onClick={() => navigate('/bookings')} className="text-primary text-xs md:text-sm font-bold hover:underline">View All</button>
                </div>
                {stats?.recent_bookings?.length > 0 ? (
                    <div className="overflow-x-auto -mx-4 md:mx-0">
                        <div className="inline-block min-w-full align-middle">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-gray-400 text-[10px] md:text-xs uppercase tracking-wider border-b border-gray-100">
                                        <th className="pb-3 md:pb-4 px-2 md:px-0">ID</th>
                                        <th className="pb-3 md:pb-4 px-2 md:px-0">Property</th>
                                        <th className="pb-3 md:pb-4 px-2 md:px-0 hidden sm:table-cell">Customer</th>
                                        <th className="pb-3 md:pb-4 px-2 md:px-0 hidden md:table-cell">Date</th>
                                        <th className="pb-3 md:pb-4 px-2 md:px-0">Status</th>
                                        <th className="pb-3 md:pb-4 px-2 md:px-0 hidden lg:table-cell">Amount</th>
                                        <th className="pb-3 md:pb-4 px-2 md:px-0">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.recent_bookings.map(b => (
                                        <tr key={b.BookingId} className="border-b border-gray-50 hover:bg-gray-50/50 transition bg-white">
                                            <td className="py-3 md:py-4 font-bold text-gray-700 text-xs md:text-sm px-2 md:px-0">#{b.BookingId}</td>
                                            <td className="py-3 md:py-4 px-2 md:px-0">
                                                <div className="font-bold text-gray-800 text-xs md:text-sm truncate max-w-[100px] md:max-w-none">{b.property?.Name}</div>
                                                <div className="text-[10px] md:text-xs text-gray-500 hidden md:block">{b.property?.Location}</div>
                                            </td>
                                            <td className="py-3 md:py-4 px-2 md:px-0 hidden sm:table-cell">
                                                <div className="font-bold text-gray-800 text-xs md:text-sm">{b.CustomerName}</div>
                                                <div className="text-[10px] md:text-xs text-gray-500 hidden md:block">{b.CustomerMobile}</div>
                                            </td>
                                            <td className="py-3 md:py-4 text-xs md:text-sm text-gray-600 px-2 md:px-0 hidden md:table-cell">
                                                {new Date(b.CheckInDate).toLocaleDateString()}
                                            </td>
                                            <td className="py-3 md:py-4 px-2 md:px-0">
                                                <StatusBadge status={b.Status} />
                                            </td>
                                            <td className="py-3 md:py-4 font-bold text-xs md:text-sm px-2 md:px-0 hidden lg:table-cell">₹{b.TotalAmount}</td>
                                            <td className="py-3 md:py-4 px-2 md:px-0">
                                                {(!b.Status || b.Status === 'pending') && (
                                                    <div className="flex gap-1 md:gap-2">
                                                        <button onClick={() => handleStatusUpdate(b.BookingId, 'confirmed')} className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition text-sm md:text-base">✓</button>
                                                        <button onClick={() => handleStatusUpdate(b.BookingId, 'rejected')} className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition text-sm md:text-base">✕</button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-400">No recent bookings</div>
                )}
            </div>

            <CalendarSelectorModal isOpen={showCalendarModal} onClose={() => setShowCalendarModal(false)} />

            <style>{`
                @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; }
            `}</style>
        </div>
    );
}

// Helper Components
const StatCard = ({ label, value, icon, color, trend }) => (
    <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 border border-gray-100 shadow-xl shadow-gray-100/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
        <div className={`absolute top-0 right-0 p-2 md:p-4 opacity-10 group-hover:opacity-20 transition-opacity text-3xl md:text-5xl text-black`}>{icon}</div>
        <div className="relative z-10">
            <div className={`w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl ${color} text-white flex items-center justify-center text-sm md:text-xl shadow-lg mb-2 md:mb-4`}>
                {icon}
            </div>
            <p className="text-gray-500 font-medium text-[10px] md:text-sm mb-1">{label}</p>
            <h3 className="text-xl md:text-3xl font-extrabold text-gray-800 tracking-tight">{value}</h3>
            {trend && <p className="text-[10px] md:text-xs font-bold text-green-500 mt-1 md:mt-2 bg-green-50 inline-block px-2 py-1 rounded-full">{trend}</p>}
        </div>
    </div>
);

const StatusBadge = ({ status }) => {
    let styles = "bg-gray-100 text-gray-600";
    if (status === 'confirmed') styles = "bg-green-100 text-green-700 border border-green-200";
    if (status === 'pending') styles = "bg-yellow-100 text-yellow-700 border border-yellow-200";
    if (status === 'cancelled') styles = "bg-red-50 text-red-600 border border-red-100";

    return <span className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider ${styles}`}>{status || 'Pending'}</span>;
};

const ActionCard = ({ title, icon, desc, onClick, color }) => (
    <button onClick={onClick} className={`p-4 md:p-6 rounded-2xl md:rounded-3xl border text-left transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group ${color} h-full flex flex-col justify-between`}>
        <div className="mb-2 md:mb-4 bg-white/50 w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-sm group-hover:scale-110 transition-transform">
            {icon}
        </div>
        <div>
            <h3 className="text-sm md:text-xl font-bold mb-0.5 md:mb-1">{title}</h3>
            <p className="text-[10px] md:text-sm opacity-80 font-medium">{desc}</p>
        </div>
    </button>
);
