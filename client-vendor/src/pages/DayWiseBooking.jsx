import { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

import { useModal } from '../context/ModalContext';

export default function DayWiseBooking() {
    const { token } = useAuth();
    const { theme, setTheme } = useTheme();
    const { showConfirm, showSuccess, showError, showInfo } = useModal();
    const location = useLocation();
    const [selectedProperty, setSelectedProperty] = useState('');
    const [properties, setProperties] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [loading, setLoading] = useState(false);

    // Freeze Modal State
    const [isFreezeModalOpen, setFreezeModalOpen] = useState(false);
    const [freezeDetails, setFreezeDetails] = useState({ year: null, month: null, day: null });
    const [freezeReason, setFreezeReason] = useState('');

    useEffect(() => {
        fetchProperties();
        fetchHolidays();
    }, []);

    useEffect(() => {
        if (selectedProperty) {
            fetchBookings();
        }
    }, [selectedProperty]);

    const fetchProperties = async () => {
        try {
            const response = await axios.get('/api/vendor/properties', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProperties(response.data);

            // Check for query param
            const queryParams = new URLSearchParams(location.search);
            const propIdParam = queryParams.get('propertyId');

            if (propIdParam) {
                // Verify user owns this property
                const exists = response.data.find(p => p.PropertyId == propIdParam);
                if (exists) {
                    setSelectedProperty(propIdParam);
                    return;
                }
            }

            // Default to first property if no param or param invalid
            if (response.data.length > 0) {
                setSelectedProperty(response.data[0].PropertyId);
            }
        } catch (error) {
            console.error('Error fetching properties:', error);
        }
    };

    const fetchHolidays = async () => {
        try {
            const response = await axios.get('/api/holidays');
            setHolidays(response.data);
        } catch (error) {
            console.error('Error fetching holidays:', error);
        }
    };

    const fetchBookings = async () => {
        setLoading(true);
        try {
            // Fetch all bookings and filter by property client-side for now
            // Ideal: API should support filtering
            const response = await axios.get('/api/vendor/bookings', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const propertyBookings = response.data.filter(b =>
                b.PropertyId == selectedProperty &&
                b.Status !== 'cancelled' &&
                b.Status !== 'rejected'
            );
            setBookings(propertyBookings);
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (bookingId, newStatus) => {
        const confirmed = await showConfirm(
            'Update Status',
            `Are you sure you want to ${newStatus === 'cancelled' ? 'cancel/unfreeze' : newStatus} this booking?`,
            'Yes, Confirm',
            'Cancel',
            'warning'
        );

        if (!confirmed) return;

        try {
            await axios.post(`/api/vendor/bookings/${bookingId}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Refresh bookings
            fetchBookings();
            showSuccess('Updated', `Status updated to ${newStatus} successfully!`);
        } catch (error) {
            console.error('Error updating status:', error);
            showError('Error', 'Failed to update booking status');
        }
    };

    const handleFreezeDate = (year, month, day) => {
        if (!selectedProperty) {
            showInfo('Select Property', 'Please select a property first');
            return;
        }
        setFreezeDetails({ year, month, day });
        setFreezeReason('');
        setFreezeModalOpen(true);
    };

    const submitFreeze = async () => {
        if (!freezeDetails.year || !selectedProperty) return;

        const { year, month, day } = freezeDetails;
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const nextDate = new Date(year, month, day + 1);
        const nextDateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;

        try {
            await axios.post('/api/vendor/bookings/freeze', {
                property_id: selectedProperty,
                start_date: dateStr,
                end_date: nextDateStr,
                reason: freezeReason || 'Manual Freeze'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchBookings();
            setFreezeModalOpen(false);
            showSuccess('Frozen', 'Date successfully frozen/blocked.');
        } catch (error) {
            console.error('Freeze error:', error);
            showError('Freeze Failed', 'Failed to freeze date: ' + (error.response?.data?.message || error.message));
        }
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay };
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const isDateBooked = (year, month, day) => {
        const checkDate = new Date(year, month, day).setHours(0, 0, 0, 0);

        // Find booking that covers this date
        // Note: CheckOutDate usually means they leave that morning, so the night is NOT booked.
        // We exclude the CheckoutDate from the "Booked" visualization slightly/logic specific.
        // If user booked 14th to 15th. 14th is booked. 15th is free.

        return bookings.find(b => {
            const start = new Date(b.CheckInDate).setHours(0, 0, 0, 0);
            const end = new Date(b.CheckOutDate).setHours(0, 0, 0, 0);
            return checkDate >= start && checkDate < end;
        });
    };

    const isHoliday = (year, month, day) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return holidays.find(h => h.date === dateStr);
    };

    const { days, firstDay } = getDaysInMonth(currentMonth);
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-color)', }}>
            <Sidebar activePage="day-wise-booking" />

            <div className="main-content">
                {/* Header - Sticky */}
                <div className="day-wise-header" style={{
                    marginBottom: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    position: 'sticky',
                    top: 0,
                    backgroundColor: 'var(--bg-color)',
                    zIndex: 100,
                    paddingBottom: '15px',
                    paddingTop: '5px',
                    borderBottom: '1px solid rgba(0,0,0,0.05)',
                    flexWrap: 'wrap', // Allow wrapping
                    gap: '15px'
                }}>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-color)', marginBottom: '5px' }}>
                            Day Wise Availability
                        </h1>
                        <p style={{ color: '#666', fontSize: '14px' }}>View month-by-month booking status</p>
                    </div>

                    <div className="header-controls" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <select
                            value={theme}
                            onChange={(e) => setTheme(e.target.value)}
                            style={{
                                padding: '10px',
                                borderRadius: '10px',
                                border: '1px solid #e0e0e0',
                                backgroundColor: 'white',
                                color: '#333',
                                cursor: 'pointer',
                                outline: 'none',
                                fontSize: '14px',
                                fontWeight: '500',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.03)'
                            }}
                        >
                            <option value="light">☀️</option>
                            <option value="dark">🌙</option>
                            <option value="website">🎨</option>
                        </select>

                        <div className="help-tip">
                            ℹ️ Click empty date to <strong>Freeze</strong>
                        </div>

                        <button
                            onClick={() => {
                                if (!bookings || bookings.length === 0) {
                                    showInfo('No Data', 'No bookings to export for this month/property.');
                                    return;
                                }

                                // CSV Headers
                                const headers = ['BookingId', 'CustomerName', 'Mobile', 'CheckInDate', 'CheckOutDate', 'Guests', 'Status', 'TotalAmount'];

                                // CSV Rows
                                const rows = bookings.map(b => [
                                    b.BookingId,
                                    `"${b.CustomerName || ''}"`, // Quote strings to handle commas
                                    `"${b.Mobile || ''}"`,
                                    new Date(b.CheckInDate).toLocaleDateString(),
                                    new Date(b.CheckOutDate).toLocaleDateString(),
                                    b.Guests,
                                    b.Status,
                                    b.TotalAmount
                                ]);

                                // Combine headers and rows
                                const csvContent = [
                                    headers.join(','),
                                    ...rows.map(r => r.join(','))
                                ].join('\n');

                                // Create download link
                                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                const url = URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.setAttribute('href', url);
                                link.setAttribute('download', `bookings_${selectedProperty}_${new Date().toISOString().split('T')[0]}.csv`);
                                link.style.visibility = 'hidden';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }}
                            style={{
                                padding: '10px 16px',
                                borderRadius: '10px',
                                border: 'none',
                                backgroundColor: '#2e7d32', // Excel/Sheet Green
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: '0 4px 12px rgba(46, 125, 50, 0.2)'
                            }}
                            title="Export to CSV"
                        >
                            <span>📊</span> Export CSV
                        </button>

                        <div className="property-select-container">
                            <select
                                value={selectedProperty}
                                onChange={e => setSelectedProperty(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 14px',
                                    borderRadius: '10px',
                                    border: '1px solid #e0e0e0',
                                    fontSize: '14px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                                    outline: 'none',
                                    cursor: 'pointer',
                                    backgroundColor: 'white',
                                    fontWeight: '500'
                                }}
                            >
                                <option value="">Select Property</option>
                                {properties.map(p => (
                                    <option key={p.PropertyId} value={p.PropertyId}>{p.Name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Calendar Container */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                    overflow: 'hidden',
                    border: '1px solid #f0f0f0',
                    position: 'relative',
                    minHeight: '400px'
                }}>
                    {loading && (
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(255,255,255,0.8)',
                            zIndex: 50,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            backdropFilter: 'blur(2px)'
                        }}>
                            <div className="spinner"></div>
                            <p style={{ marginTop: '15px', color: 'var(--primary-color)', fontWeight: '600' }}>Loading Availability...</p>
                        </div>
                    )}
                    {/* Calendar Controls - Sticky within container if needed, but top header is already sticky. 
                        Let's keep this part of the card flow. */}
                    <div style={{
                        padding: '20px 30px',
                        borderBottom: '1px solid #eee',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: 'var(--sidebar-bg)'
                    }}>
                        <button onClick={prevMonth} className="nav-btn">
                            ← Previous Month
                        </button>
                        <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-color)' }}>
                            {monthNames[currentMonth.getMonth()]} <span style={{ color: '#00bcd4' }}>{currentMonth.getFullYear()}</span>
                        </h2>
                        <button onClick={nextMonth} className="nav-btn">
                            Next Month →
                        </button>
                    </div>

                    {/* Week Days */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        backgroundColor: 'var(--hover-bg)',
                        borderBottom: `1px solid var(--border-color)`
                    }}>
                        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d, index) => (
                            <div key={d} style={{
                                textAlign: 'center',
                                fontWeight: '700',
                                color: index === 0 || index === 6 ? '#d32f2f' : 'var(--text-color)', // Red for weekends
                                padding: '15px 10px',
                                fontSize: '13px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        gridAutoRows: 'minmax(140px, auto)',
                        backgroundColor: 'var(--bg-color)',
                        className: 'calendar-grid' // Marker for CSS targeting
                    }}>
                        {Array(firstDay).fill(null).map((_, i) => (
                            <div key={`empty-${i}`} style={{
                                borderBottom: '1px solid var(--border-color)',
                                borderRight: '1px solid var(--border-color)',
                                backgroundColor: 'var(--hover-bg)'
                            }} />
                        ))}

                        {Array(days).fill(null).map((_, i) => {
                            const day = i + 1;
                            const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                            const dayOfWeek = dateObj.getDay(); // 0=Sun, 6=Sat

                            const booking = isDateBooked(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                            const holiday = isHoliday(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                            const isToday = new Date().getDate() === day && new Date().getMonth() === currentMonth.getMonth() && new Date().getFullYear() === currentMonth.getFullYear();

                            // Determine background color
                            let bgColor = 'white';
                            if (isToday) bgColor = 'var(--hover-bg)';
                            else if (booking && booking.Status === 'blocked') bgColor = 'var(--hover-bg-red)';
                            else if (dayOfWeek === 0 || dayOfWeek === 6 || holiday) bgColor = '#ffebee'; // Red background for weekends/holidays

                            return (
                                <div
                                    key={day}
                                    onClick={() => !booking && !holiday && handleFreezeDate(currentMonth.getFullYear(), currentMonth.getMonth(), day)}
                                    style={{
                                        borderBottom: '1px solid var(--border-color)',
                                        borderRight: '1px solid var(--border-color)',
                                        padding: '12px',
                                        position: 'relative',
                                        backgroundColor: bgColor,
                                        cursor: !booking && !holiday ? 'pointer' : 'default',
                                        transition: 'all 0.2s',
                                        opacity: booking && booking.Status === 'blocked' ? 0.9 : 1
                                    }}
                                    className={!booking && !holiday ? "calendar-cell-hover" : ""}
                                    title={!booking && !holiday ? "Click to Freeze Date" : ""}
                                >
                                    <div style={{
                                        fontWeight: '700',
                                        marginBottom: '8px',
                                        color: (isToday ? 'var(--primary-color)' : (dayOfWeek === 0 || dayOfWeek === 6 || holiday ? '#d32f2f' : 'var(--text-color)')),
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        fontSize: '15px'
                                    }}>
                                        <span style={{
                                            width: '28px',
                                            height: '28px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: '50%',
                                            backgroundColor: isToday ? 'var(--primary-color)' : 'transparent',
                                            color: isToday ? 'white' : 'inherit'
                                        }}>{day}</span>
                                    </div>

                                    {holiday && (
                                        <div style={{
                                            marginBottom: '5px',
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            color: 'var(--primary-color)',
                                            backgroundColor: 'var(--hover-bg)',
                                            padding: '3px 8px',
                                            borderRadius: '10px',
                                            display: 'inline-block',
                                            boxShadow: '0 2px 4px rgba(0, 150, 136, 0.1)'
                                        }}>
                                            🎉 {holiday.name}
                                        </div>
                                    )}

                                    {booking && (
                                        <div style={{
                                            backgroundColor: booking.Status === 'blocked' ? 'var(--hover-bg-red)' : (booking.Status === 'pending' || !booking.Status ? 'var(--hover-bg)' : 'var(--bg-color)'),
                                            borderLeft: `4px solid ${booking.Status === 'confirmed' ? 'var(--primary-color)' : booking.Status === 'blocked' ? 'var(--border-color)' : booking.Status === 'pending' || !booking.Status ? 'var(--primary-color)' : 'var(--primary-color)'}`,
                                            padding: '8px 10px',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            marginTop: '5px',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                                        }}>
                                            {booking.Status === 'blocked' ? (
                                                <>
                                                    <div style={{ fontWeight: '700', color: '#455a64', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        ❄️ FROZEN
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: '#78909c', margin: '2px 0' }}>{Math.floor(Math.random() * 1000) > 500 ? 'Maintenance' : 'Owner Block'}</div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleStatusUpdate(booking.BookingId, 'cancelled');
                                                        }}
                                                        style={{
                                                            marginTop: '6px',
                                                            border: 'none',
                                                            backgroundColor: 'var(--sidebar-bg)',
                                                            color: 'var(--text-color)',
                                                            border: `1px solid var(--border-color)`,
                                                            padding: '3px 8px',
                                                            cursor: 'pointer',
                                                            fontSize: '10px',
                                                            fontWeight: '600',
                                                            width: '100%'
                                                        }}
                                                    >
                                                        Unfreeze
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <div style={{ fontWeight: '600', color: '#333', marginBottom: '2px', fontSize: '13px' }}>
                                                        {booking.CustomerName}
                                                    </div>
                                                    <div style={{ color: '#666', fontSize: '11px' }}>
                                                        {booking.Guests} Guests
                                                    </div>
                                                    <div style={{
                                                        marginTop: '5px',
                                                        fontSize: '10px',
                                                        textTransform: 'uppercase',
                                                        fontWeight: 'bold',
                                                        color: booking.Status === 'confirmed' ? '#0097a7' : '#f57f17'
                                                    }}>
                                                        {booking.Status || 'Pending'}
                                                    </div>

                                                    {/* Action Buttons for Pending Bookings */}
                                                    {(!booking.Status || booking.Status === 'pending') && (
                                                        <div style={{ display: 'flex', gap: '5px', marginTop: '8px' }}>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleStatusUpdate(booking.BookingId, 'confirmed');
                                                                }}
                                                                style={{
                                                                    border: 'none',
                                                                    backgroundColor: 'var(--primary-color)',
                                                                    color: 'white',
                                                                    borderRadius: '4px',
                                                                    padding: '5px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '10px',
                                                                    flex: 1,
                                                                    fontWeight: '600'
                                                                }}
                                                                title="Approve"
                                                            >
                                                                ✓
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleStatusUpdate(booking.BookingId, 'rejected');
                                                                }}
                                                                style={{
                                                                    border: 'none',
                                                                    backgroundColor: 'var(--hover-bg-red)',
                                                                    color: 'var(--text-color)',
                                                                    borderRadius: '4px',
                                                                    padding: '5px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '10px',
                                                                    flex: 1,
                                                                    fontWeight: '600'
                                                                }}
                                                                title="Reject"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <style>{`
                    .main-content {
                        flex: 1;
                        margin-left: 200px;
                        padding: 30px;
                        transition: all 0.2s;
                        background-color: var(--bg-color);
                    }
                    .property-select-container {
                        width: 250px;
                    }
                    .help-tip {
                        font-size: 14px;
                        color: var(--primary-color);
                        background-color: var(--hover-bg);
                        padding: 8px 16px;
                        borderRadius: 20px;
                        font-weight: 500;
                        display: flex;
                        alignItems: center;
                        gap: 5px;
                    }
                    .nav-btn {
                        background-color: var(--sidebar-bg);
                        border: 1px solid var(--border-color);
                        padding: 10px 20px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 600;
                        color: var(--text-color);
                        transition: all 0.2s;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.03);
                    }
                    .nav-btn:hover {
                        background-color: var(--hover-bg);
                        color: var(--primary-color);
                        border-color: var(--border-color);
                        transform: translateY(-1px);
                    }
                    .calendar-cell-hover:hover {
                        background-color: var(--hover-bg) !important;
                        box-shadow: inset 0 0 0 2px var(--primary-color);
                    }
                    
                    /* Modal Styles */
                    .modal-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background-color: rgba(0,0,0,0.6);
                        backdrop-filter: blur(4px);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        z-index: 2000;
                    }
                    .modal-content {
                        background-color: white;
                        border-radius: 16px;
                        padding: 30px;
                        width: 90%;
                        max-width: 420px;
                        box-shadow: 0 20px 50px rgba(0,0,0,0.2);
                        animation: slideUp 0.3s ease;
                    }
                    @keyframes slideUp {
                        from { transform: translateY(30px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                    .modal-title {
                        margin: 0 0 10px 0;
                        font-size: 22px;
                        color: #333;
                        font-weight: 700;
                    }
                    .modal-label {
                        display: block;
                        margin-bottom: 8px;
                        font-weight: 600;
                        font-size: 14px;
                        color: #444;
                    }
                    .modal-input {
                        width: 100%;
                        padding: 12px;
                        border: 1px solid #ddd;
                        border-radius: 8px;
                        margin-bottom: 24px;
                        font-size: 15px;
                        transition: border-color 0.2s;
                    }
                    .modal-input:focus {
                        border-color: #00bcd4;
                        outline: none;
                        box-shadow: 0 0 0 3px rgba(0, 188, 212, 0.1);
                    }
                    .modal-actions {
                        display: flex;
                        gap: 12px;
                        justify-content: flex-end;
                    }
                    .btn-primary {
                        background-color: #00bcd4;
                        color: white;
                        border: none;
                        padding: 10px 24px;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: background-color 0.2s;
                    }
                    .btn-primary:hover {
                        background-color: #0097a7;
                    }
                    .btn-secondary {
                        background-color: #f5f5f5;
                        color: #555;
                        border: 1px solid #ddd;
                        padding: 10px 24px;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .btn-secondary:hover {
                        background-color: #eeeeee;
                        color: #333;
                    }

                    @media (max-width: 768px) {
                        .main-content {
                            margin-left: 0 !important; /* Full width on mobile */
                            padding: 15px !important;
                            overflow-x: hidden;
                        }
                        
                        .day-wise-header {
                            flex-direction: column;
                            align-items: flex-start !important;
                            gap: 15px;
                            position: relative !important; /* Unstick on very small screens if needed, or keep sticky but reduce size */
                        }

                        .header-controls {
                            width: 100%;
                            justify-content: space-between;
                        }

                        .property-select-container {
                            flex: 1;
                        }

                        .help-tip {
                            display: none; /* Save space on mobile */
                        }
                        
                        h1 { font-size: 20px !important; margin-bottom: 2px !important; }
                        p { font-size: 12px !important; margin: 0 !important; }

                        h2 { font-size: 16px !important; }
                        .nav-btn { padding: 6px 10px; font-size: 12px; }
                        
                        /* Calendar stack adjustments */
                        div[style*="min-height: 600px"] {
                            padding: 10px !important;
                            min-height: auto !important;
                        }
                        
                        div[style*="gridAutoRows: 'minmax(140px, auto)'"] {
                             grid-auto-rows: minmax(100px, auto) !important; /* Smaller rows on mobile */
                        }
                    }

                    /* Spinner Animation */
                    .spinner {
                        width: 40px;
                        height: 40px;
                        border: 4px solid rgba(0, 188, 212, 0.1);
                        border-left-color: var(--primary-color);
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                    }
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>

                {/* Freeze Modal */}
                {isFreezeModalOpen && (
                    <div className="modal-overlay" onClick={() => setFreezeModalOpen(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                <span style={{ fontSize: '24px' }}>❄️</span>
                                <h3 className="modal-title">Freeze Date</h3>
                            </div>
                            <p style={{ marginBottom: '25px', color: '#666', lineHeight: '1.5', fontSize: '14px' }}>
                                This will block bookings for this date. Customers will see it as unavailable.
                            </p>

                            <label className="modal-label">Selected Date</label>
                            <div style={{
                                marginBottom: '20px',
                                fontWeight: '700',
                                fontSize: '18px',
                                color: '#00bcd4',
                                backgroundColor: '#e0f7fa',
                                padding: '10px',
                                borderRadius: '8px',
                                textAlign: 'center'
                            }}>
                                {freezeDetails.year}-{String(freezeDetails.month + 1).padStart(2, '0')}-{String(freezeDetails.day).padStart(2, '0')}
                            </div>

                            <label className="modal-label">Reason (Optional)</label>
                            <input
                                className="modal-input"
                                value={freezeReason}
                                onChange={e => setFreezeReason(e.target.value)}
                                placeholder="e.g. Maintenance, Personal Use..."
                                autoFocus
                            />

                            <div className="modal-actions">
                                <button onClick={() => setFreezeModalOpen(false)} className="btn-secondary">Cancel</button>
                                <button onClick={submitFreeze} className="btn-primary">Confirm Freeze</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
}
