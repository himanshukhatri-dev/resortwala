import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { API_BASE_URL } from '../config';
import { FaBuilding, FaLink } from 'react-icons/fa';

export default function Bookings() {
    const { token } = useAuth();
    const { showConfirm, showSuccess, showError } = useModal();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/bookings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBookings(res.data);
        } catch (error) {
            console.error(error);
            showError('Error', 'Failed to fetch bookings');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        const action = status === 'confirmed' ? 'Approve' : 'Disapprove';
        const confirmed = await showConfirm(
            `${action} Booking`,
            `Are you sure you want to ${action.toLowerCase()} this booking?`,
            action,
            'Cancel',
            status === 'confirmed' ? 'confirm' : 'danger'
        );

        if (!confirmed) return;

        try {
            await axios.post(`${API_BASE_URL}/admin/bookings/${id}/status`,
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchBookings(); // Refresh list
            showSuccess('Success', `Booking ${status} successfully`);
        } catch (error) {
            console.error(error);
            showError('Error', `Failed to ${action.toLowerCase()} booking`);
        }
    };

    // Filter Logic
    const filteredBookings = bookings.filter(booking =>
        booking.CustomerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.property?.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.BookingId.toString().includes(searchTerm)
    );

    // Pagination Logic
    const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
    const displayedBookings = filteredBookings.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const getStatusBadge = (status) => {
        const styles = {
            confirmed: { backgroundColor: '#e8f5e9', color: '#2e7d32', border: '1px solid #c8e6c9' },
            rejected: { backgroundColor: '#ffebee', color: '#c62828', border: '1px solid #ffcdd2' },
            cancelled: { backgroundColor: '#ffebee', color: '#c62828', border: '1px solid #ffcdd2' },
            pending: { backgroundColor: '#fff3e0', color: '#ef6c00', border: '1px solid #ffe0b2' },
            blocked: { backgroundColor: '#e0e0e0', color: '#616161', border: '1px solid #bdbdbd' },
        };
        const s = status?.toLowerCase() || 'pending';
        return (
            <span style={{
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600',
                textTransform: 'capitalize',
                display: 'inline-block',
                ...styles[s]
            }}>
                {s}
            </span>
        );
    };

    return (
        <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <h1 className="text-2xl md:text-3xl font-extrabold text-indigo-900 tracking-tight">Booking Management</h1>
                <div className="w-full md:w-auto">
                    <input
                        type="text"
                        placeholder="Search IDs, Customers, or Properties..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full md:w-80 px-5 py-3 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none shadow-sm transition-all"
                    />
                </div>
            </div>

            {loading ? <p>Loading...</p> : (
                <>
                    <div className="bg-white rounded-2xl shadow-xl shadow-indigo-100/20 border border-gray-100 overflow-hidden">
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 border-bottom-2 border-gray-100">
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">ID</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Property</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Customer</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Dates</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Total</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayedBookings.map(booking => (
                                        <tr key={booking.BookingId} className="border-b border-gray-50 hover:bg-indigo-50/10 transition">
                                            <td className="px-6 py-5 font-mono text-sm text-gray-400">#{booking.BookingId}</td>
                                            <td className="px-6 py-5">
                                                <div className="font-bold text-gray-900">{booking.property?.Name || 'Unknown'}</div>
                                                <div className="text-xs text-gray-400">{booking.property?.Location}</div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="font-semibold text-gray-900">{booking.CustomerName}</div>
                                                <div className="text-xs text-gray-400">{booking.CustomerMobile}</div>
                                                {booking.CustomerEmail && <div className="text-xs text-gray-400">{booking.CustomerEmail}</div>}
                                                <BookingSourceBadge source={booking.booking_source} />
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <div className="text-sm font-semibold text-gray-900">{new Date(booking.CheckInDate).toLocaleDateString()}</div>
                                                <div className="text-[10px] text-gray-400 font-bold uppercase">To {new Date(booking.CheckOutDate).toLocaleDateString()}</div>
                                            </td>
                                            <td className="px-6 py-5 font-extrabold text-indigo-600">₹{booking.TotalAmount}</td>
                                            <td className="px-6 py-5 text-center">{getStatusBadge(booking.Status)}</td>
                                            <td className="px-6 py-5">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => handleStatusUpdate(booking.BookingId, 'confirmed')}
                                                        disabled={booking.Status === 'confirmed'}
                                                        className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all ${booking.Status === 'confirmed' ? 'bg-gray-50 text-gray-300 cursor-not-allowed' : 'bg-green-50 text-green-700 hover:bg-green-100 hover:scale-105 active:scale-95'}`}
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(booking.BookingId, 'rejected')}
                                                        disabled={booking.Status === 'rejected'}
                                                        className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all ${booking.Status === 'rejected' ? 'bg-gray-50 text-gray-300 cursor-not-allowed' : 'bg-red-50 text-red-700 hover:bg-red-100 hover:scale-105 active:scale-95'}`}
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile view (Cards) */}
                        <div className="md:hidden divide-y divide-gray-100">
                            {displayedBookings.length === 0 ? (
                                <div className="p-10 text-center text-gray-400">No bookings found.</div>
                            ) : (
                                displayedBookings.map(booking => (
                                    <div key={booking.BookingId} className="p-5 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="text-xs font-mono text-gray-400 mb-1">#{booking.BookingId}</div>
                                                <div className="font-bold text-gray-900 text-lg">{booking.property?.Name || 'Unknown'}</div>
                                                <div className="text-xs text-gray-500">{booking.property?.Location}</div>
                                            </div>
                                            {getStatusBadge(booking.Status)}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                            <div>
                                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer</div>
                                                <div className="font-semibold text-gray-800 text-sm">{booking.CustomerName}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Amount</div>
                                                <div className="font-extrabold text-indigo-600">₹{booking.TotalAmount}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Check-In</div>
                                                <div className="font-semibold text-gray-800 text-sm">{new Date(booking.CheckInDate).toLocaleDateString()}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Check-Out</div>
                                                <div className="font-semibold text-gray-800 text-sm">{new Date(booking.CheckOutDate).toLocaleDateString()}</div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleStatusUpdate(booking.BookingId, 'confirmed')}
                                                disabled={booking.Status === 'confirmed'}
                                                className={`flex-1 py-3 rounded-xl text-sm font-bold shadow-sm transition-all ${booking.Status === 'confirmed' ? 'bg-gray-50 text-gray-300' : 'bg-green-500 text-white active:scale-95'}`}
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleStatusUpdate(booking.BookingId, 'rejected')}
                                                disabled={booking.Status === 'rejected'}
                                                className={`flex-1 py-3 rounded-xl text-sm font-bold shadow-sm transition-all ${booking.Status === 'rejected' ? 'bg-gray-50 text-gray-300' : 'bg-red-500 text-white active:scale-95'}`}
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '40px' }}>
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                style={{ padding: '8px 16px', border: 'none', background: '#f0f0f0', borderRadius: '6px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                            >
                                Prev
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => setCurrentPage(i + 1)}
                                    style={{
                                        padding: '8px 12px',
                                        border: 'none',
                                        backgroundColor: currentPage === i + 1 ? '#1a237e' : '#f0f0f0',
                                        color: currentPage === i + 1 ? 'white' : 'black',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                style={{ padding: '8px 16px', border: 'none', background: '#f0f0f0', borderRadius: '6px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// Booking Source Badge Component
function BookingSourceBadge({ source }) {
    const badges = {
        'customer_app': { label: 'ResortWala', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: <FaBuilding className="text-[8px]" /> },
        'public_calendar': { label: 'Public Link', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: <FaLink className="text-[8px]" /> },
        'vendor_manual': { label: 'Manual', color: 'bg-gray-50 text-gray-700 border-gray-200', icon: null },
        'admin_manual': { label: 'Admin', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: null },
    };

    const badge = badges[source] || badges['customer_app'];

    return (
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border mt-1 ${badge.color}`}>
            {badge.icon} {badge.label}
        </span>
    );
}
