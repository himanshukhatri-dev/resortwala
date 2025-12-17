import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useModal } from '../context/ModalContext';

export default function Dashboard() {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await axios.get('/api/vendor/stats', {
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
            await axios.post(`/api/vendor/bookings/${bookingId}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Refresh stats to update the list
            fetchStats();
            await showSuccess('Status Updated', `Booking ${newStatus} successfully!`);
        } catch (error) {
            console.error('Error updating status:', error);
            showError('Update Failed', 'Failed to update booking status');
        }
    };



    if (loading) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
    }

    return (
        <div style={{ padding: '0px' }}>
            <div className="dashboard-content" style={{ padding: '30px' }}>
                {/* Status Alert */}
                {stats?.approval_status !== 'approved' && (
                    <div style={{
                        backgroundColor: '#fff3cd',
                        border: '1px solid #ffc107',
                        borderRadius: '8px',
                        padding: '15px 20px',
                        marginBottom: '25px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <span style={{ fontSize: '20px' }}>⏳</span>
                        <div>
                            <strong>Pending Approval:</strong> Your vendor account is awaiting admin approval.
                            You can view your properties but cannot add new ones until approved.
                        </div>
                    </div>
                )}

                {/* Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                    <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                            <div>
                                <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Total Properties</p>
                                <p style={{ fontSize: '32px', fontWeight: '700', color: '#667eea' }}>{stats?.total_properties || 0}</p>
                            </div>
                            <div style={{ fontSize: '32px' }}>🏠</div>
                        </div>
                    </div>
                    <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                            <div>
                                <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Approved</p>
                                <p style={{ fontSize: '32px', fontWeight: '700', color: '#28a745' }}>{stats?.approved_properties || 0}</p>
                            </div>
                            <div style={{ fontSize: '32px' }}>✓</div>
                        </div>
                    </div>
                    <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                            <div>
                                <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Total Bookings</p>
                                <p style={{ fontSize: '32px', fontWeight: '700', color: '#00bcd4' }}>{stats?.total_bookings || 0}</p>
                            </div>
                            <div style={{ fontSize: '32px' }}>📅</div>
                        </div>
                    </div>
                    <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                            <div>
                                <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Total Revenue</p>
                                <p style={{ fontSize: '32px', fontWeight: '700', color: '#ffc107' }}>₹{stats?.total_revenue || 0}</p>
                            </div>
                            <div style={{ fontSize: '32px' }}>💰</div>
                        </div>
                    </div>
                </div>

                {stats?.recent_bookings && stats.recent_bookings.length > 0 && (
                    <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '25px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Recent Bookings</h3>
                            <button onClick={() => navigate('/bookings')} style={{ color: '#667eea', fontWeight: '600', fontSize: '14px', cursor: 'pointer', background: 'none', border: 'none' }}>View All</button>
                        </div>

                        {/* Desktop Table View */}
                        <div className="desktop-table-view" style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#666' }}>ID</th>
                                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#666' }}>Property</th>
                                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#666' }}>Customer</th>
                                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#666' }}>Stay</th>
                                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#666' }}>Guests</th>
                                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#666' }}>Amount</th>
                                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#666' }}>Status</th>
                                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#666' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.recent_bookings.map((booking) => (
                                        <tr key={booking.BookingId} style={{ borderBottom: '1px solid #f8f8f8' }}>
                                            <td style={{ padding: '12px', fontSize: '13px', color: '#888' }}>#{booking.BookingId}</td>
                                            <td style={{ padding: '12px' }}>
                                                <div style={{ fontSize: '14px', fontWeight: '500' }}>{booking.property?.Name || 'N/A'}</div>
                                                <div style={{ fontSize: '12px', color: '#666' }}>📍 {booking.property?.Location || ''}</div>
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                <div style={{ fontSize: '14px', fontWeight: '500' }}>{booking.CustomerName}</div>
                                                <div style={{ fontSize: '12px', color: '#666' }}>{booking.CustomerMobile}</div>
                                            </td>
                                            <td style={{ padding: '12px', fontSize: '13px' }}>
                                                <div>{new Date(booking.CheckInDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</div>
                                                <div style={{ color: '#888', fontSize: '11px' }}>to {new Date(booking.CheckOutDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</div>
                                            </td>
                                            <td style={{ padding: '12px', fontSize: '13px' }}>
                                                👤 {booking.Guests || '-'}
                                            </td>
                                            <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600' }}>₹{booking.TotalAmount}</td>
                                            <td style={{ padding: '12px', fontSize: '13px' }}>
                                                <span style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '12px',
                                                    fontSize: '11px',
                                                    fontWeight: '600',
                                                    textTransform: 'capitalize',
                                                    backgroundColor:
                                                        booking.Status === 'confirmed' ? '#def7ec' :
                                                            booking.Status === 'pending' ? '#fff8db' :
                                                                booking.Status === 'cancelled' ? '#fde8e8' : '#e5e7eb',
                                                    color:
                                                        booking.Status === 'confirmed' ? '#03543f' :
                                                            booking.Status === 'pending' ? '#b45309' :
                                                                booking.Status === 'cancelled' ? '#9b1c1c' : '#374151',
                                                    border: `1px solid ${booking.Status === 'confirmed' ? '#bcf0da' :
                                                        booking.Status === 'pending' ? '#fce96a' :
                                                            booking.Status === 'cancelled' ? '#fbd5d5' : '#d1d5db'}`
                                                }}>
                                                    {booking.Status || 'Pending'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                {(!booking.Status || booking.Status === 'pending') && (
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button
                                                            onClick={() => handleStatusUpdate(booking.BookingId, 'confirmed')}
                                                            style={{ padding: '6px', borderRadius: '4px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                                                            title="Approve"
                                                        >
                                                            ✓
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(booking.BookingId, 'rejected')}
                                                            style={{ padding: '6px', borderRadius: '4px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                                                            title="Reject"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="mobile-card-view">
                            {stats.recent_bookings.map((booking) => (
                                <div key={booking.BookingId} style={{ border: '1px solid #eee', borderRadius: '8px', padding: '15px', marginBottom: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <span style={{ fontWeight: '600', fontSize: '14px' }}>#{booking.BookingId}</span>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '12px',
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            textTransform: 'capitalize',
                                            backgroundColor:
                                                booking.Status === 'confirmed' ? '#def7ec' :
                                                    booking.Status === 'pending' ? '#fff8db' :
                                                        booking.Status === 'cancelled' ? '#fde8e8' : '#e5e7eb',
                                            color:
                                                booking.Status === 'confirmed' ? '#03543f' :
                                                    booking.Status === 'pending' ? '#b45309' :
                                                        booking.Status === 'cancelled' ? '#9b1c1c' : '#374151'
                                        }}>
                                            {booking.Status || 'Pending'}
                                        </span>
                                    </div>
                                    <div style={{ marginBottom: '5px', fontSize: '14px', fontWeight: '600' }}>
                                        {booking.property?.Name || 'N/A'}
                                        <span style={{ fontSize: '12px', color: '#666', marginLeft: '5px', fontWeight: '400' }}>
                                            ({booking.property?.Location})
                                        </span>
                                    </div>
                                    <div style={{ marginBottom: '10px', fontSize: '13px', color: '#666', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                                        <div>👤 {booking.CustomerName}</div>
                                        <div>👥 {booking.Guests || '-'} Guests</div>
                                        <div>📅 {new Date(booking.CheckInDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} - {new Date(booking.CheckOutDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</div>
                                        <div>💰 ₹{booking.TotalAmount}</div>
                                    </div>

                                    {(!booking.Status || booking.Status === 'pending') && (
                                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #f0f0f0' }}>
                                            <button
                                                onClick={() => handleStatusUpdate(booking.BookingId, 'confirmed')}
                                                style={{ flex: 1, padding: '8px', borderRadius: '6px', background: '#059669', color: 'white', border: 'none', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleStatusUpdate(booking.BookingId, 'rejected')}
                                                style={{ flex: 1, padding: '8px', borderRadius: '6px', background: '#dc2626', color: 'white', border: 'none', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Quick Actions</h3>
                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                        <button
                            onClick={async () => {
                                try {
                                    const response = await axios.get('/api/vendor/bookings', {
                                        headers: { Authorization: `Bearer ${token}` }
                                    });
                                    const bookings = response.data;

                                    const csvContent = "data:text/csv;charset=utf-8,"
                                        + "Villa Name,Booked Dates\n"
                                        + bookings.map(b => {
                                            const checkIn = new Date(b.CheckInDate).toLocaleDateString();
                                            const checkOut = new Date(b.CheckOutDate).toLocaleDateString();
                                            return `"${b.property?.Name || 'N/A'}","${checkIn} - ${checkOut}"`;
                                        }).join("\n");

                                    const encodedUri = encodeURI(csvContent);
                                    const link = document.createElement("a");
                                    link.setAttribute("href", encodedUri);
                                    link.setAttribute("download", "bookings_calendar.csv");
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);

                                } catch (error) {
                                    console.error("Export failed", error);
                                    showError('Export Failed', 'Could not fetch bookings for export.');
                                }
                            }}
                            className="action-btn"
                            style={{
                                padding: '12px 24px',
                                background: '#10B981',
                                border: 'none',
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            📊 Export Excel
                        </button>
                        <button
                            onClick={async () => {
                                try {
                                    const response = await axios.get('/api/vendor/bookings', {
                                        headers: { Authorization: `Bearer ${token}` }
                                    });
                                    const bookings = response.data;

                                    // Filter for next 30 days
                                    const today = new Date();
                                    const next30Days = new Date();
                                    next30Days.setDate(today.getDate() + 30);

                                    const nextMonthBookings = bookings.filter(b => {
                                        const checkIn = new Date(b.CheckInDate);
                                        const checkOut = new Date(b.CheckOutDate);
                                        // Overlap logic: (StartA <= EndB) and (EndA >= StartB)
                                        return checkIn <= next30Days && checkOut >= today;
                                    });

                                    if (nextMonthBookings.length === 0) {
                                        window.open(`https://wa.me/?text=${encodeURIComponent("📅 *Availability Update*\n\nAll properties are *AVAILABLE* for the next 30 days! ✅")}`, '_blank');
                                        return;
                                    }

                                    let message = "📅 *Booked Dates (Next 30 Days)*\n\n";

                                    // Group by Property
                                    const grouped = {};
                                    nextMonthBookings.forEach(b => {
                                        const propName = b.property?.Name || 'Villa';
                                        if (!grouped[propName]) grouped[propName] = [];
                                        grouped[propName].push(b);
                                    });

                                    for (const [prop, books] of Object.entries(grouped)) {
                                        message += `*${prop}*:\n`;
                                        books.forEach(b => {
                                            const checkIn = new Date(b.CheckInDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
                                            const checkOut = new Date(b.CheckOutDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
                                            message += `❌ ${checkIn} - ${checkOut}\n`;
                                        });
                                        message += "\n";
                                    }

                                    message += "✅ All other dates are *AVAILABLE*";

                                    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');

                                } catch (error) {
                                    console.error("Share failed", error);
                                    showError('Share Failed', 'Could not fetch bookings to share.');
                                }
                            }}
                            className="action-btn"
                            style={{
                                padding: '12px 24px',
                                background: '#25D366',
                                border: 'none',
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            💬 Share Availability
                        </button>
                        <button
                            onClick={() => navigate('/properties')}
                            style={{
                                padding: '12px 24px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                border: 'none',
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                            className="action-btn"
                        >
                            📋 Manage Properties
                        </button>
                        <button
                            onClick={() => navigate('/bookings')}
                            style={{
                                padding: '12px 24px',
                                background: 'linear-gradient(135deg, #00bcd4 0%, #0097a7 100%)',
                                border: 'none',
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                            className="action-btn"
                        >
                            📅 View Bookings
                        </button>
                        <button
                            onClick={() => navigate('/properties/1/calendar')}
                            style={{
                                padding: '12px 24px',
                                background: 'linear-gradient(135deg, #009688 0%, #00796b 100%)',
                                border: 'none',
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                            className="action-btn"
                        >
                            📅 Availability Calendar
                        </button>
                        <button
                            onClick={() => navigate('/day-wise-booking')}
                            style={{
                                padding: '12px 24px',
                                background: 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)',
                                border: 'none',
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                            className="action-btn"
                        >
                            📊 Day Wise Booking
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                    .action-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 20px rgba(0,0,0,0.15);
                    }
                    
                    /* Desktop view by default */
                    .mobile-card-view {
                        display: none;
                    }

                    @media (max-width: 768px) {
                        /* Switch to Card View on Mobile */
                        .desktop-table-view {
                            display: none;
                        }
                        .mobile-card-view {
                            display: block;
                        }
                        
                        /* Layout Adjustments */
                        div[style*="marginLeft: 70px"], div[style*="marginLeft: 200px"] {
                            margin-left: 0 !important; /* Remove sidebar margin */
                            padding-bottom: 70px; /* Add space for bottom nav if present, else just space */
                            overflow-x: hidden; /* Prevent horizontal scroll */
                        }
                        
                        /* Fix Content Padding on Mobile */
                        .dashboard-content {
                            padding: 15px !important;
                        }

                        /* Fix Header Padding on Mobile */
                        .dashboard-header {
                            padding: 15px !important;
                        }
                        
                        div[style*="gridTemplateColumns"] {
                            grid-template-columns: 1fr !important; /* Stack stats cards */
                        }
                    }
                `}</style>
        </div>
    );
}
