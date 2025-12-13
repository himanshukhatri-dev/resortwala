import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

import { useModal } from '../context/ModalContext';

export default function VendorBookings() {
    const { user, token, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const { showConfirm, showSuccess, showError } = useModal();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

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
            const response = await axios.get('http://192.168.1.105:8000/api/vendor/bookings', {
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
            await axios.post(`http://192.168.1.105:8000/api/vendor/bookings/${bookingId}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Refresh bookings
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

            // Reset hours for accurate date comparison
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

    if (loading) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>Loading bookings...</div>;
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
            <Sidebar activePage="vendor-bookings" />
            <div style={{ flex: 1, marginLeft: '250px', padding: '30px', transition: 'all 0.3s' }}>
                {/* 1. Header Area - Sticky */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '20px',
                    position: 'sticky',
                    top: 0,
                    zIndex: 102,
                    backgroundColor: 'var(--bg-color)',
                    paddingBottom: '15px',
                    paddingTop: '5px'
                }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-color)', marginBottom: '5px' }}>
                            Bookings Management
                        </h1>
                        <p style={{ color: 'var(--text-color)', opacity: 0.7, fontSize: '15px' }}>
                            View and manage your property bookings
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <select
                            value={theme}
                            onChange={(e) => setTheme(e.target.value)}
                            style={{
                                padding: '10px 14px',
                                borderRadius: '10px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'var(--sidebar-bg)',
                                color: 'var(--text-color)',
                                cursor: 'pointer',
                                outline: 'none',
                                fontSize: '14px',
                                fontWeight: '500',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.03)'
                            }}
                        >
                            <option value="light">☀️ Light</option>
                            <option value="dark">🌙 Dark</option>
                            <option value="website">🎨 Original</option>
                        </select>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-color)' }}>{user?.name || 'Vendor'}</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-color)', opacity: 0.6 }}>Property Owner</div>
                        </div>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--primary-color), #2196f3)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '18px'
                        }}>
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </div>

                {/* 2. Filter Row - Sticky (Below Header) */}
                <div style={{
                    backgroundColor: 'var(--sidebar-bg)',
                    padding: '15px 30px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    position: 'sticky',
                    top: '73px', // Height of the first header approx
                    zIndex: 101,
                    borderTop: '1px solid var(--border-color)'
                }}>
                    {/* Search */}
                    <div style={{ position: 'relative', flex: 1 }}>
                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }}>🔍</span>
                        <input
                            type="text"
                            placeholder="Search guest, ID, or property..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 10px 10px 35px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                fontSize: '14px',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                                backgroundColor: 'var(--sidebar-bg)',
                                color: 'var(--text-color)'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                        />
                    </div>

                    {/* Date Filters */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '10px', top: '-8px', backgroundColor: 'var(--sidebar-bg)', padding: '0 4px', fontSize: '11px', color: 'var(--primary-color)', fontWeight: '600', zIndex: 5 }}>From</span>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    fontSize: '14px',
                                    outline: 'none',
                                    color: 'var(--text-color)',
                                    backgroundColor: 'var(--sidebar-bg)',
                                    cursor: 'pointer',
                                    minWidth: '140px'
                                }}
                            />
                        </div>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '10px', top: '-8px', backgroundColor: 'var(--sidebar-bg)', padding: '0 4px', fontSize: '11px', color: 'var(--primary-color)', fontWeight: '600', zIndex: 5 }}>To</span>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    fontSize: '14px',
                                    outline: 'none',
                                    color: 'var(--text-color)',
                                    backgroundColor: 'var(--sidebar-bg)',
                                    cursor: 'pointer',
                                    minWidth: '140px'
                                }}
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div style={{ minWidth: '150px' }}>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                fontSize: '14px',
                                outline: 'none',
                                backgroundColor: 'var(--sidebar-bg)',
                                color: 'var(--text-color)',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>

                    {/* Clear Button */}
                    {(searchText || dateFrom || dateTo || statusFilter !== 'all') && (
                        <button
                            onClick={() => {
                                setSearchText('');
                                setDateFrom('');
                                setDateTo('');
                                setStatusFilter('all');
                            }}
                            style={{
                                padding: '8px 16px',
                                fontSize: '13px',
                                color: '#d32f2f',
                                backgroundColor: '#ffebee',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: '600'
                            }}
                        >
                            Reset
                        </button>
                    )}
                </div>

                {/* Content */}
                <div style={{ padding: '30px' }}>
                    {/* 3. Bookings Table */}
                    <div style={{
                        backgroundColor: 'var(--sidebar-bg)',
                        borderRadius: '16px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                        padding: '25px',
                        border: '1px solid var(--border-color)',
                        marginTop: '20px'
                    }}>
                        <div style={{ overflowX: 'auto' }}>
                            {loading ? (
                                <p style={{ textAlign: 'center', color: 'var(--text-color)', padding: '20px' }}>Loading bookings...</p>
                            ) : filteredBookings.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-color)', opacity: 0.7 }}>
                                    <p>No bookings match your filters.</p>
                                </div>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', minWidth: '800px' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: 'var(--bg-secondary)' }}>
                                            <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: 'var(--text-color)', borderBottom: '2px solid var(--border-color)', borderTopLeftRadius: '12px' }}>ID</th>
                                            <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: 'var(--text-color)', borderBottom: '2px solid var(--border-color)' }}>PROPERTY</th>
                                            <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: 'var(--text-color)', borderBottom: '2px solid var(--border-color)' }}>GUEST</th>
                                            <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: 'var(--text-color)', borderBottom: '2px solid var(--border-color)' }}>DATES</th>
                                            <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: 'var(--text-color)', borderBottom: '2px solid var(--border-color)' }}>AMOUNT</th>
                                            <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: 'var(--text-color)', borderBottom: '2px solid var(--border-color)' }}>STATUS</th>
                                            <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: 'var(--text-color)', borderBottom: '2px solid var(--border-color)', borderTopRightRadius: '12px' }}>ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredBookings.map((booking, index) => (
                                            <tr key={booking.BookingId} style={{ backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)', transition: 'background-color 0.2s' }} className="hover:bg-gray-50">
                                                <td style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', fontSize: '14px', color: 'var(--text-color)', fontWeight: '600' }}>#{booking.BookingId}</td>
                                                <td style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', fontSize: '14px', color: 'var(--text-color)' }}>
                                                    <div style={{ fontWeight: '600' }}>{booking.property?.Name || 'Unknown Property'}</div>
                                                    <div style={{ fontSize: '12px', opacity: 0.6 }}>{booking.property?.Location || 'No location'}</div>
                                                </td>
                                                <td style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                                                            {booking.CustomerName?.charAt(0) || 'G'}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-color)' }}>{booking.CustomerName || 'Guest'}</div>
                                                            <div style={{ fontSize: '12px', opacity: 0.6, color: 'var(--text-color)' }}>{booking.CustomerMobile || 'N/A'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
                                                    <div style={{ fontSize: '14px', color: 'var(--text-color)', fontWeight: '500' }}>
                                                        {new Date(booking.CheckInDate).toLocaleDateString()}
                                                    </div>
                                                    <div style={{ fontSize: '12px', opacity: 0.6 }}>
                                                        ➜ {new Date(booking.CheckOutDate).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', fontSize: '14px', fontWeight: '700', color: 'var(--text-color)' }}>
                                                    ₹{booking.TotalAmount?.toLocaleString()}
                                                </td>
                                                <td style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
                                                    <span style={{
                                                        display: 'inline-block',
                                                        padding: '6px 14px',
                                                        borderRadius: '20px',
                                                        fontSize: '12px',
                                                        fontWeight: '600',
                                                        textTransform: 'capitalize',
                                                        backgroundColor:
                                                            booking.Status === 'confirmed' ? '#def7ec' :
                                                                booking.Status === 'pending' ? '#fdf6b2' :
                                                                    booking.Status === 'cancelled' ? '#fde8e8' : '#e5e7eb',
                                                        color:
                                                            booking.Status === 'confirmed' ? '#03543f' :
                                                                booking.Status === 'pending' ? '#723b13' :
                                                                    booking.Status === 'cancelled' ? '#9b1c1c' : '#374151'
                                                    }}>
                                                        {booking.Status || 'Pending'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
                                                    <div style={{ display: 'flex', gap: '10px' }}>
                                                        {(!booking.Status || booking.Status === 'pending') && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleStatusUpdate(booking.BookingId, 'confirmed')}
                                                                    style={{ padding: '6px 12px', borderRadius: '6px', background: '#0e9f6e', color: 'white', fontWeight: '600', fontSize: '12px', border: 'none', transition: 'background 0.2s' }}
                                                                    title="Confirm"
                                                                >
                                                                    Confirm
                                                                </button>
                                                                <button
                                                                    onClick={() => handleStatusUpdate(booking.BookingId, 'rejected')}
                                                                    style={{ padding: '6px 12px', borderRadius: '6px', background: '#ffe4e6', color: '#be123c', fontWeight: '600', fontSize: '12px', border: 'none' }}
                                                                    title="Reject"
                                                                >
                                                                    Reject
                                                                </button>
                                                            </>
                                                        )}
                                                        {booking.Status === 'confirmed' && (
                                                            <button
                                                                onClick={() => handleStatusUpdate(booking.BookingId, 'cancelled')}
                                                                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db', background: 'transparent', color: '#374151', fontWeight: '600', fontSize: '12px' }}
                                                            >
                                                                Cancel
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
