import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { useModal } from '../context/ModalContext';

export default function VendorBookings() {
    const { user, token } = useAuth();
    const { theme, setTheme } = useTheme();
    const { showConfirm, showSuccess, showError } = useModal();
    const navigate = useNavigate();
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
            const response = await axios.get('/api/vendor/bookings', {
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
            await axios.post(`/api/vendor/bookings/${bookingId}/status`,
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
    const getStatusStyle = (status) => {
        switch (status) {
            case 'confirmed': return { bg: '#def7ec', color: '#03543f', border: '1px solid #bcf0da' };
            case 'pending': return { bg: '#fff8db', color: '#92400e', border: '1px solid #fceebf' };
            case 'cancelled': return { bg: '#fde8e8', color: '#9b1c1c', border: '1px solid #fbd5d5' };
            case 'rejected': return { bg: '#fde8e8', color: '#9b1c1c', border: '1px solid #fbd5d5' };
            default: return { bg: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' };
        }
    };

    if (loading) {
        return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-color)' }}>Loading bookings...</div>;
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-color)', overflowX: 'hidden' }}>
            <Sidebar
                activePage="vendor-bookings"
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
            />

            <div className="main-content">
                {/* 1. Header Area - Sticky */}
                <div className="header-sticky">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <button
                                className="mobile-menu-btn"
                                onClick={() => setIsMobileMenuOpen(true)}
                            >
                                ☰
                            </button>
                            <div>
                                <h1 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-color)', margin: 0 }}>
                                    Bookings
                                </h1>
                                <p style={{ color: 'var(--text-color)', opacity: 0.6, fontSize: '13px', margin: '2px 0 0 0' }}>
                                    Manage your reservations
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div className="desktop-only" style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-color)' }}>{user?.name || 'Vendor'}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-color)', opacity: 0.6 }}>Property Owner</div>
                            </div>
                            <div style={{
                                width: '35px',
                                height: '35px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--primary-color), #2196f3)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                fontSize: '16px'
                            }}>
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                        </div>
                    </div>

                    {/* 2. Compact Filter Row - Redesigned */}
                    <div className="filter-container">
                        <div className="search-box">
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                placeholder="Search guest, ID..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                className="filter-input search-input"
                            />
                        </div>

                        <div className="filter-controls">
                            <div className="date-group">
                                <span className="label">From</span>
                                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="filter-input date-input" />
                            </div>
                            <div className="date-group">
                                <span className="label">To</span>
                                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="filter-input date-input" />
                            </div>

                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-input select-input">
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>

                            {(searchText || dateFrom || dateTo || statusFilter !== 'all') && (
                                <button onClick={() => { setSearchText(''); setDateFrom(''); setDateTo(''); setStatusFilter('all'); }} className="reset-btn">
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. Content Area */}
                <div style={{ padding: '15px 20px' }}>
                    {filteredBookings.length === 0 ? (
                        <div className="empty-state">
                            <p>No bookings match your filters.</p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="desktop-table-container">
                                <table className="booking-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Guest</th>
                                            <th>Property</th>
                                            <th>Check-In</th>
                                            <th>Check-Out</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredBookings.map((booking) => {
                                            const statusStyle = getStatusStyle(booking.Status || 'pending');
                                            return (
                                                <tr key={booking.BookingId}>
                                                    <td className="fw-600">#{booking.BookingId}</td>
                                                    <td>
                                                        <div className="fw-600">{booking.CustomerName || 'Guest'}</div>
                                                        <div className="sub-text">{booking.CustomerMobile}</div>
                                                    </td>
                                                    <td>
                                                        <div className="fw-500">{booking.property?.Name || 'Unknown'}</div>
                                                        <div className="sub-text">{booking.property?.Location}</div>
                                                    </td>
                                                    <td className="fw-500">{new Date(booking.CheckInDate).toLocaleDateString()}</td>
                                                    <td className="fw-500">{new Date(booking.CheckOutDate).toLocaleDateString()}</td>
                                                    <td className="fw-600">₹{booking.TotalAmount?.toLocaleString()}</td>
                                                    <td>
                                                        <span className="status-badge" style={{ backgroundColor: statusStyle.bg, color: statusStyle.color, border: statusStyle.border }}>
                                                            {booking.Status || 'Pending'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <ActionButtons booking={booking} onUpdate={handleStatusUpdate} />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="mobile-card-list">
                                {filteredBookings.map((booking) => {
                                    const statusStyle = getStatusStyle(booking.Status || 'pending');
                                    return (
                                        <div key={booking.BookingId} className="booking-card">
                                            <div className="card-header">
                                                <div>
                                                    <span className="card-id">#{booking.BookingId}</span>
                                                    <div className="fw-600 name-text">{booking.CustomerName || 'Guest'}</div>
                                                    <div className="sub-text">{booking.property?.Name}</div>
                                                </div>
                                                <span className="status-badge" style={{ backgroundColor: statusStyle.bg, color: statusStyle.color, border: statusStyle.border }}>
                                                    {booking.Status || 'Pending'}
                                                </span>
                                            </div>

                                            <div className="card-body">
                                                <div className="date-row">
                                                    <div>
                                                        <div className="label">Check In</div>
                                                        <div className="val">{new Date(booking.CheckInDate).toLocaleDateString()}</div>
                                                    </div>
                                                    <div className="arrow">➜</div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div className="label">Check Out</div>
                                                        <div className="val">{new Date(booking.CheckOutDate).toLocaleDateString()}</div>
                                                    </div>
                                                </div>

                                                <div className="amount-row">
                                                    <span>Total Amount</span>
                                                    <span className="amount">₹{booking.TotalAmount?.toLocaleString()}</span>
                                                </div>
                                            </div>

                                            {(!booking.Status || booking.Status === 'confirmed' || booking.Status === 'pending') && (
                                                <div className="card-actions">
                                                    <ActionButtons booking={booking} onUpdate={handleStatusUpdate} isMobile />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <style>{`
                .main-content {
                    flex: 1;
                    margin-left: 70px;
                    transition: margin-left 0.3s;
                    width: 100%;
                    background-color: var(--bg-color);
                }
                .main-content:hover {
                    margin-left: 240px;
                }

                .header-sticky {
                    position: sticky;
                    top: 0;
                    z-index: 99;
                    background-color: var(--bg-color);
                    padding: 15px 20px;
                    border-bottom: 1px solid var(--border-color);
                    box-shadow: 0 2px 10px rgba(0,0,0,0.02);
                }

                .filter-container {
                    background-color: var(--sidebar-bg);
                    padding: 10px 15px;
                    border-radius: 12px;
                    border: 1px solid var(--border-color);
                    display: flex;
                    gap: 15px;
                    align-items: center;
                    flex-wrap: wrap;
                }

                .search-box {
                    position: relative;
                    flex-grow: 1;
                    min-width: 200px;
                }
                .search-icon {
                    position: absolute;
                    left: 10px;
                    top: 50%;
                    transform: translateY(-50%);
                    opacity: 0.5;
                    font-size: 14px;
                }
                .filter-input {
                    padding: 8px 12px;
                    border-radius: 8px;
                    border: 1px solid var(--border-color);
                    background-color: var(--bg-color);
                    color: var(--text-color);
                    font-size: 13px;
                    outline: none;
                    transition: border-color 0.2s;
                }
                .search-input { width: 100%; padding-left: 32px; }
                .filter-input:focus { border-color: var(--primary-color); }

                .filter-controls {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                    flex-wrap: wrap;
                }
                .date-group {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .label { font-size: 12px; opacity: 0.7; font-weight: 500; }
                .date-input { width: 130px; }
                .select-input { min-width: 120px; cursor: pointer; }

                .reset-btn {
                    padding: 6px 12px;
                    background: #fee2e2;
                    color: #991b1b;
                    border: none;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                }

                /* Table Styles */
                .desktop-table-container { 
                    display: block; 
                    background-color: var(--sidebar-bg);
                    border-radius: 12px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.03);
                    overflow-x: auto;
                    border: 1px solid var(--border-color);
                }
                .booking-table { width: 100%; border-collapse: collapse; min-width: 900px; }
                .booking-table th { 
                    padding: 14px 16px; 
                    text-align: left; 
                    font-size: 12px; 
                    font-weight: 700; 
                    color: var(--text-color); 
                    opacity: 0.6; 
                    border-bottom: 1px solid var(--border-color);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .booking-table td { padding: 14px 16px; border-bottom: 1px solid var(--border-color); font-size: 13px; color: var(--text-color); vertical-align: middle; }
                .booking-table tr:last-child td { border-bottom: none; }
                .booking-table tr:hover { background-color: rgba(0,0,0,0.02); }
                
                .fw-600 { font-weight: 600; }
                .fw-500 { font-weight: 500; }
                .sub-text { font-size: 11px; opacity: 0.6; margin-top: 2px; }
                .status-badge { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: capitalize; display: inline-block; }

                .empty-state { text-align: center; padding: 40px; color: var(--text-color); opacity: 0.6; font-size: 14px; background: var(--sidebar-bg); border-radius: 12px; border: 1px solid var(--border-color); }

                /* Action Buttons */
                .action-group { display: flex; gap: 6px; }
                .btn-action { padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; border: none; cursor: pointer; transition: opacity 0.2s; white-space: nowrap; }
                .btn-confirm { background-color: #0e9f6e; color: white; }
                .btn-reject { background-color: #fee2e2; color: #991b1b; }
                .btn-cancel { border: 1px solid #d1d5db; background: transparent; color: #374151; }
                
                /* Mobile Card Styles */
                .mobile-card-list { display: none; flex-direction: column; gap: 15px; }
                .booking-card {
                    background-color: var(--sidebar-bg);
                    padding: 16px;
                    border-radius: 12px;
                    border: 1px solid var(--border-color);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.03);
                }
                .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
                .card-id { font-size: 11px; opacity: 0.5; font-weight: 700; letter-spacing: 0.5px; }
                .name-text { font-size: 15px; margin-top: 2px; }
                
                .card-body { border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color); padding: 12px 0; margin-bottom: 12px; }
                .date-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 13px; }
                .date-row .label { font-size: 10px; opacity: 0.5; text-transform: uppercase; margin-bottom: 2px; }
                .date-row .val { font-weight: 500; }
                .date-row .arrow { opacity: 0.3; }
                
                .amount-row { display: flex; justify-content: space-between; align-items: center; font-size: 14px; font-weight: 500; }
                .amount-row .amount { color: var(--primary-color); font-weight: 700; font-size: 16px; }
                
                .card-actions { display: flex; gap: 8px; }
                .card-actions .btn-action { flex: 1; padding: 10px; font-size: 13px; }

                /* Responsive */
                @media (max-width: 768px) {
                    .main-content { margin-left: 0; }
                    .main-content:hover { margin-left: 0; }
                    .desktop-only { display: none; }
                    .mobile-menu-btn { display: block; background: none; border: none; font-size: 24px; color: var(--text-color); cursor: pointer; }
                    
                    .desktop-table-container { display: none; }
                    .mobile-card-list { display: flex; }
                    
                    .filter-container { flex-direction: column; align-items: stretch; gap: 10px; padding: 15px; }
                    .filter-controls { justify-content: space-between; }
                    .date-group { flex: 1; }
                    .date-input { width: 100%; }
                    .select-input { width: 100%; }
                    .header-sticky { padding: 12px 15px; }
                }
            `}</style>
        </div>
    );
}

function ActionButtons({ booking, onUpdate, isMobile }) {
    if (!booking.Status || booking.Status === 'pending') {
        return (
            <div className={`action-group ${isMobile ? 'w-100' : ''}`}>
                <button
                    onClick={() => onUpdate(booking.BookingId, 'confirmed')}
                    className="btn-action btn-confirm">
                    Confirm
                </button>
                <button
                    onClick={() => onUpdate(booking.BookingId, 'rejected')}
                    className="btn-action btn-reject">
                    Reject
                </button>
            </div>
        );
    }
    if (booking.Status === 'confirmed') {
        return (
            <div className={isMobile ? 'w-100' : ''} style={isMobile ? { width: '100%', display: 'flex' } : {}}>
                <button
                    onClick={() => onUpdate(booking.BookingId, 'cancelled')}
                    className="btn-action btn-cancel"
                    style={isMobile ? { flex: 1 } : {}}>
                    Cancel Booking
                </button>
            </div>
        );
    }
    return null;
}
