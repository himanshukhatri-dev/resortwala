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
                    margin-left: 70px; /* Fixed margin matching collapsed sidebar width */
                    width: calc(100% - 70px);
                    background-color: var(--bg-color);
                    transition: all 0.3s ease;
                }
                
                /* Remove hover shift to prevent table movement */
                /* .main-content:hover { margin-left: 240px; } */

                .header-sticky {
                    position: sticky;
                    top: 0;
                    z-index: 99;
                    background-color: rgba(255, 255, 255, 0.9);
                    backdrop-filter: blur(10px);
                    padding: 20px 30px;
                    border-bottom: 1px solid rgba(0,0,0,0.05);
                }

                .filter-container {
                    background-color: white;
                    padding: 12px;
                    border-radius: 100px; /* Pill shape for premium feel */
                    border: 1px solid #e5e7eb;
                    display: flex;
                    gap: 15px;
                    align-items: center;
                    flex-wrap: wrap;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                }

                .search-box {
                    position: relative;
                    flex-grow: 1;
                    min-width: 250px;
                }
                .search-icon {
                    position: absolute;
                    left: 16px;
                    top: 50%;
                    transform: translateY(-50%);
                    opacity: 0.4;
                    font-size: 16px;
                }
                .filter-input {
                    padding: 10px 16px;
                    border-radius: 50px;
                    border: 1px solid transparent;
                    background-color: #f3f4f6;
                    color: #1f2937;
                    font-size: 14px;
                    font-weight: 500;
                    outline: none;
                    transition: all 0.2s;
                }
                .search-input { width: 100%; padding-left: 42px; border-radius: 50px; }
                .filter-input:focus { background-color: white; border-color: #000; box-shadow: 0 0 0 4px rgba(0,0,0,0.05); }

                .filter-controls {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                    flex-wrap: wrap;
                }
                .date-group { display: flex; alignItems: center; gap: 8px; }
                .label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.5; }
                .date-input { width: auto; font-family: inherit; }
                .select-input { padding-right: 32px; cursor: pointer; }

                .reset-btn {
                    padding: 8px 16px;
                    background: #fee2e2;
                    color: #ef4444;
                    border: none;
                    border-radius: 50px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .reset-btn:hover { background: #fecaca; }

                /* Table Styles */
                .desktop-table-container { 
                    display: block; 
                    background-color: white;
                    border-radius: 20px;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.01);
                    overflow: hidden;
                    border: 1px solid #f3f4f6;
                    margin-top: 10px;
                }
                .booking-table { width: 100%; border-collapse: separate; border-spacing: 0; min-width: 900px; }
                .booking-table th { 
                    padding: 20px 24px; 
                    text-align: left; 
                    font-size: 12px; 
                    font-weight: 800; 
                    color: #9ca3af; 
                    border-bottom: 2px solid #f3f4f6;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    background: white;
                }
                .booking-table td { 
                    padding: 20px 24px; 
                    border-bottom: 1px solid #f3f4f6; 
                    font-size: 14px; 
                    color: #374151; 
                    vertical-align: middle; 
                    transition: background 0.1s;
                }
                .booking-table tr:last-child td { border-bottom: none; }
                .booking-table tr:hover td { background-color: #f9fafb; }
                
                .fw-600 { font-weight: 600; color: #111827; }
                .fw-500 { font-weight: 500; }
                .sub-text { font-size: 12px; color: #6b7280; margin-top: 4px; }
                .status-badge { 
                    padding: 6px 12px; 
                    border-radius: 50px; 
                    font-size: 12px; 
                    font-weight: 700; 
                    text-transform: capitalize; 
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                }
                .status-badge::before {
                    content: '';
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background-color: currentColor;
                }

                .empty-state { text-align: center; padding: 60px; color: #9ca3af; font-size: 16px; background: white; border-radius: 20px; border: 2px dashed #e5e7eb; }

                /* Action Buttons */
                .action-group { display: flex; gap: 8px; }
                .btn-action { 
                    padding: 8px 16px; 
                    border-radius: 8px; 
                    font-size: 13px; 
                    font-weight: 600; 
                    border: none; 
                    cursor: pointer; 
                    transition: all 0.2s; 
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }
                .btn-confirm { background-color: #10b981; color: white; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2); }
                .btn-confirm:hover { background-color: #059669; transform: translateY(-1px); }
                
                .btn-reject { background-color: white; color: #ef4444; border: 1px solid #fee2e2; }
                .btn-reject:hover { background-color: #fef2f2; border-color: #fca5a5; }
                
                .btn-cancel { border: 1px solid #e5e7eb; background: white; color: #6b7280; }
                .btn-cancel:hover { background: #f9fafb; border-color: #d1d5db; color: #374151; }
                
                /* Mobile Card Styles */
                .mobile-card-list { display: none; flex-direction: column; gap: 15px; }
                .booking-card {
                    background-color: white;
                    padding: 20px;
                    border-radius: 16px;
                    border: 1px solid #f3f4f6;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                }
                .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
                .card-id { font-size: 12px; color: #9ca3af; font-weight: 700; letter-spacing: 0.5px; }
                .name-text { font-size: 16px; margin-top: 4px; color: #111827; }
                
                .card-body { border-top: 1px solid #f3f4f6; border-bottom: 1px solid #f3f4f6; padding: 16px 0; margin-bottom: 16px; }
                .amount-row .amount { color: #111827; font-weight: 800; font-size: 18px; }

                /* Responsive */
                @media (max-width: 768px) {
                    .main-content { margin-left: 0; width: 100%; padding: 0 !important; }
                    .header-sticky { padding: 15px; }
                    .filter-container { padding: 10px; border-radius: 16px; }
                    .desktop-only { display: none; }
                    .mobile-menu-btn { display: block; background: none; border: none; font-size: 24px; cursor: pointer; }
                    
                    .desktop-table-container { display: none; }
                    .mobile-card-list { display: flex; padding: 0 15px 30px; }
                    
                    .filter-controls { width: 100%; }
                    .date-group { flex: 1; min-width: 45%; }
                    .date-input { width: 100%; padding: 8px 12px; }
                    .select-input { width: 100%; padding: 8px 12px; }
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
