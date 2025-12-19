import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { API_BASE_URL } from '../config';

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1a237e' }}>Booking Management</h1>
                <input
                    type="text"
                    placeholder="Search by ID, Customer, or Property..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    style={{
                        padding: '12px 20px',
                        width: '300px',
                        borderRadius: '30px',
                        border: '1px solid #e0e0e0',
                        fontSize: '14px',
                        outline: 'none',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                    }}
                />
            </div>

            {loading ? <p>Loading...</p> : (
                <>
                    <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f9f9f9', borderBottom: '2px solid #eee' }}>
                                    <th style={{ padding: '15px 20px', fontWeight: '600', color: '#555' }}>ID</th>
                                    <th style={{ padding: '15px 20px', fontWeight: '600', color: '#555' }}>Property</th>
                                    <th style={{ padding: '15px 20px', fontWeight: '600', color: '#555' }}>Customer</th>
                                    <th style={{ padding: '15px 20px', fontWeight: '600', color: '#555' }}>Check-in</th>
                                    <th style={{ padding: '15px 20px', fontWeight: '600', color: '#555' }}>Check-out</th>
                                    <th style={{ padding: '15px 20px', fontWeight: '600', color: '#555' }}>Total</th>
                                    <th style={{ padding: '15px 20px', fontWeight: '600', color: '#555' }}>Status</th>
                                    <th style={{ padding: '15px 20px', fontWeight: '600', color: '#555' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayedBookings.map(booking => (
                                    <tr key={booking.BookingId} style={{ borderBottom: '1px solid #eee', transition: 'background-color 0.2s' }}>
                                        <td style={{ padding: '15px 20px', fontWeight: '600', color: '#666' }}>#{booking.BookingId}</td>
                                        <td style={{ padding: '15px 20px' }}>
                                            <div style={{ fontWeight: '600', color: '#333' }}>{booking.property?.Name || 'Unknown'}</div>
                                            <div style={{ fontSize: '12px', color: '#888' }}>{booking.property?.Location}</div>
                                        </td>
                                        <td style={{ padding: '15px 20px' }}>{booking.CustomerName}</td>
                                        <td style={{ padding: '15px 20px' }}>{new Date(booking.CheckInDate).toLocaleDateString()}</td>
                                        <td style={{ padding: '15px 20px' }}>{new Date(booking.CheckOutDate).toLocaleDateString()}</td>
                                        <td style={{ padding: '15px 20px', fontWeight: '600' }}>₹{booking.TotalAmount}</td>
                                        <td style={{ padding: '15px 20px' }}>{getStatusBadge(booking.Status)}</td>
                                        <td style={{ padding: '15px 20px' }}>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => handleStatusUpdate(booking.BookingId, 'confirmed')}
                                                    disabled={booking.Status === 'confirmed'}
                                                    style={{
                                                        padding: '6px 12px',
                                                        backgroundColor: booking.Status === 'confirmed' ? '#f5f5f5' : '#e8f5e9',
                                                        color: booking.Status === 'confirmed' ? '#aaa' : '#2e7d32',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        cursor: booking.Status === 'confirmed' ? 'default' : 'pointer',
                                                        fontSize: '12px',
                                                        fontWeight: '600',
                                                        opacity: booking.Status === 'confirmed' ? 0.6 : 1
                                                    }}
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleStatusUpdate(booking.BookingId, 'rejected')}
                                                    disabled={booking.Status === 'rejected'}
                                                    style={{
                                                        padding: '6px 12px',
                                                        backgroundColor: booking.Status === 'rejected' ? '#f5f5f5' : '#ffebee',
                                                        color: booking.Status === 'rejected' ? '#aaa' : '#c62828',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        cursor: booking.Status === 'rejected' ? 'default' : 'pointer',
                                                        fontSize: '12px',
                                                        fontWeight: '600',
                                                        opacity: booking.Status === 'rejected' ? 0.6 : 1
                                                    }}
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredBookings.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                                <p style={{ fontSize: '18px' }}>No bookings found.</p>
                            </div>
                        )}
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
