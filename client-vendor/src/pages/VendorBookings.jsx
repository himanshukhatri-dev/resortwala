import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import Sidebar from '../components/Sidebar';
import { useModal } from '../context/ModalContext';
import { FaSearch, FaCalendarAlt, FaFilter, FaCheck, FaTimes, FaBan, FaBars } from 'react-icons/fa';

export default function VendorBookings() {
    const { user, token } = useAuth();
    const { showConfirm, showSuccess, showError } = useModal();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Filter States
    const [searchText, setSearchText] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            // FIXED: API Path
            const response = await axios.get(`${API_BASE_URL}/vendor/bookings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBookings(response.data);
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (bookingId, newStatus) => {
        const confirmed = await showConfirm(
            'Update Status',
            `Are you sure you want to ${newStatus} this booking?`,
            'Yes, Update',
            'Cancel',
            newStatus === 'rejected' || newStatus === 'cancelled' ? 'danger' : 'confirm'
        );

        if (!confirmed) return;

        try {
            // FIXED: API Path
            await axios.post(`${API_BASE_URL}/vendor/bookings/${bookingId}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            fetchBookings();
            await showSuccess('Status Updated', `Booking ${newStatus} successfully!`);
        } catch (error) {
            console.error('Error updating status:', error);
            showError('Update Failed', 'Failed to update booking status');
        }
    };

    // Filter Logic
    const filteredBookings = useMemo(() => {
        return bookings.filter(booking => {
            const matchesSearch = (
                (booking.CustomerName?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
                (booking.BookingId?.toString() || '').includes(searchText) ||
                (booking.property?.Name?.toLowerCase() || '').includes(searchText.toLowerCase())
            );

            const bookingDate = new Date(booking.CheckInDate);
            const fromDate = dateFrom ? new Date(dateFrom) : null;
            const toDate = dateTo ? new Date(dateTo) : null;

            if (bookingDate) bookingDate.setHours(0, 0, 0, 0);
            if (fromDate) fromDate.setHours(0, 0, 0, 0);
            if (toDate) toDate.setHours(0, 0, 0, 0);

            let matchesDate = true;
            if (fromDate && bookingDate < fromDate) matchesDate = false;
            if (toDate && bookingDate > toDate) matchesDate = false;

            const matchesStatus = statusFilter === 'all' || booking.Status === statusFilter || (!booking.Status && statusFilter === 'pending');

            return matchesSearch && matchesDate && matchesStatus;
        });
    }, [bookings, searchText, dateFrom, dateTo, statusFilter]);

    // Status Badge Helper
    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
            case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center text-gray-500">Loading bookings...</div>;

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar
                activePage="vendor-bookings"
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
            />

            <div className="flex-1 md:ml-[70px] transition-all duration-300 w-full">
                {/* 1. Header Area - Sticky */}
                <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md px-6 py-4 border-b border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-4">
                            <button className="md:hidden text-2xl" onClick={() => setIsMobileMenuOpen(true)}>
                                <FaBars />
                            </button>
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold text-gray-900">Bookings</h1>
                                <p className="text-sm text-gray-500 hidden md:block">Manage your reservations</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="text-right hidden md:block">
                                <div className="font-bold text-gray-900 text-sm">{user?.name || 'Vendor'}</div>
                                <div className="text-xs text-gray-500">Property Owner</div>
                            </div>
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 text-white flex items-center justify-center font-bold shadow-sm">
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                        </div>
                    </div>

                    {/* 2. Compact Filter Row */}
                    <div className="bg-white p-3 rounded-full border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                        <div className="relative flex-1 min-w-[200px]">
                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search guest, ID..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                className="w-full bg-gray-50 pl-10 pr-4 py-2.5 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/5"
                            />
                        </div>

                        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-full border border-gray-100">
                                <span className="text-xs font-bold text-gray-400 uppercase">From</span>
                                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-transparent text-sm font-medium outline-none" />
                            </div>
                            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-full border border-gray-100">
                                <span className="text-xs font-bold text-gray-400 uppercase">To</span>
                                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-transparent text-sm font-medium outline-none" />
                            </div>
                            <div className="relative">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="appearance-none bg-gray-50 pl-4 pr-10 py-2.5 rounded-full text-sm font-bold border border-gray-100 outline-none cursor-pointer hover:bg-gray-100 transition"
                                >
                                    <option value="all">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                                <FaFilter className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
                            </div>

                            {(searchText || dateFrom || dateTo || statusFilter !== 'all') && (
                                <button onClick={() => { setSearchText(''); setDateFrom(''); setDateTo(''); setStatusFilter('all'); }} className="px-4 py-2 bg-red-50 text-red-500 rounded-full text-xs font-bold hover:bg-red-100 transition">
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. Content Area */}
                <div className="p-4 md:p-6">
                    {filteredBookings.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-3xl">📅</div>
                            <p className="text-gray-500 font-medium">No bookings match your filters.</p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden md:block bg-white rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden border border-gray-100">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100">
                                            <th className="p-5 text-xs font-extrabold text-gray-400 uppercase tracking-wider">ID</th>
                                            <th className="p-5 text-xs font-extrabold text-gray-400 uppercase tracking-wider">Guest</th>
                                            <th className="p-5 text-xs font-extrabold text-gray-400 uppercase tracking-wider">Property</th>
                                            <th className="p-5 text-xs font-extrabold text-gray-400 uppercase tracking-wider">Dates</th>
                                            <th className="p-5 text-xs font-extrabold text-gray-400 uppercase tracking-wider">Amount</th>
                                            <th className="p-5 text-xs font-extrabold text-gray-400 uppercase tracking-wider">Status</th>
                                            <th className="p-5 text-xs font-extrabold text-gray-400 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredBookings.map((booking) => (
                                            <tr key={booking.BookingId} className="hover:bg-gray-50/50 transition duration-150">
                                                <td className="p-5 font-bold text-gray-900">#{booking.BookingId}</td>
                                                <td className="p-5">
                                                    <div className="font-bold text-gray-900">{booking.CustomerName || 'Guest'}</div>
                                                    <div className="text-xs text-gray-500 mt-0.5">{booking.CustomerMobile}</div>
                                                </td>
                                                <td className="p-5">
                                                    <div className="font-medium text-gray-900">{booking.property?.Name || 'Unknown'}</div>
                                                    <div className="text-xs text-gray-500 mt-0.5">{booking.property?.Location}</div>
                                                </td>
                                                <td className="p-5 text-sm font-medium text-gray-600">
                                                    {new Date(booking.CheckInDate).toLocaleDateString()} <span className="text-gray-300">➜</span> {new Date(booking.CheckOutDate).toLocaleDateString()}
                                                </td>
                                                <td className="p-5 font-bold text-gray-900">₹{booking.TotalAmount?.toLocaleString()}</td>
                                                <td className="p-5">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(booking.Status || 'pending')}`}>
                                                        {booking.Status || 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="p-5">
                                                    <ActionButtons booking={booking} onUpdate={handleStatusUpdate} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden space-y-4">
                                {filteredBookings.map((booking) => (
                                    <div key={booking.BookingId} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <span className="text-xs font-bold text-gray-400">#{booking.BookingId}</span>
                                                <div className="font-bold text-gray-900 text-lg mt-1">{booking.CustomerName || 'Guest'}</div>
                                                <div className="text-xs text-gray-500">{booking.property?.Name}</div>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(booking.Status || 'pending')}`}>
                                                {booking.Status || 'Pending'}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl mb-4 text-sm font-medium text-gray-700">
                                            <FaCalendarAlt className="text-gray-400" />
                                            <span>{new Date(booking.CheckInDate).toLocaleDateString()}</span>
                                            <span className="text-gray-400">➜</span>
                                            <span>{new Date(booking.CheckOutDate).toLocaleDateString()}</span>
                                        </div>

                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-sm font-bold text-gray-400 uppercase">Total</span>
                                            <span className="text-xl font-bold text-gray-900">₹{booking.TotalAmount?.toLocaleString()}</span>
                                        </div>

                                        {(!booking.Status || booking.Status === 'confirmed' || booking.Status === 'pending') && (
                                            <div className="pt-4 border-t border-gray-100">
                                                <ActionButtons booking={booking} onUpdate={handleStatusUpdate} isMobile />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function ActionButtons({ booking, onUpdate, isMobile }) {
    if (!booking.Status || booking.Status === 'pending') {
        return (
            <div className={`flex gap-2 ${isMobile ? 'w-full' : ''}`}>
                <button
                    onClick={() => onUpdate(booking.BookingId, 'confirmed')}
                    className={`flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-sm ${isMobile ? 'flex-1' : ''}`}>
                    <FaCheck /> Confirm
                </button>
                <button
                    onClick={() => onUpdate(booking.BookingId, 'rejected')}
                    className={`flex items-center justify-center gap-2 px-4 py-2 bg-white border border-red-100 text-red-500 hover:bg-red-50 rounded-xl text-xs font-bold transition ${isMobile ? 'flex-1' : ''}`}>
                    <FaTimes /> Reject
                </button>
            </div>
        );
    }
    if (booking.Status === 'confirmed') {
        return (
            <div className={isMobile ? 'flex w-full' : ''}>
                <button
                    onClick={() => onUpdate(booking.BookingId, 'cancelled')}
                    className={`flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-xs font-bold transition ${isMobile ? 'flex-1' : ''}`}>
                    <FaBan /> Cancel Booking
                </button>
            </div>
        );
    }
    return null;
}
