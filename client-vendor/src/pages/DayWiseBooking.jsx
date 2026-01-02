import { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useModal } from '../context/ModalContext';

export default function DayWiseBooking() {
    const { token } = useAuth();
    const { showConfirm, showSuccess, showError, showInfo } = useModal();
    const location = useLocation();

    const [selectedProperty, setSelectedProperty] = useState('');
    const [properties, setProperties] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Freeze Modal State
    const [isFreezeModalOpen, setFreezeModalOpen] = useState(false);
    const [freezeDetails, setFreezeDetails] = useState({ year: null, month: null, day: null });
    const [freezeReason, setFreezeReason] = useState('');

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
            const response = await axios.get(`${API_BASE_URL}/vendor/properties`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProperties(response.data);

            const queryParams = new URLSearchParams(location.search);
            const propIdParam = queryParams.get('propertyId');

            if (propIdParam) {
                const exists = response.data.find(p => p.PropertyId == propIdParam);
                if (exists) {
                    setSelectedProperty(propIdParam);
                    return;
                }
            }

            if (response.data.length > 0) {
                setSelectedProperty(response.data[0].PropertyId);
            }
        } catch (error) {
            console.error('Error fetching properties:', error);
        }
    };

    const fetchHolidays = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/holidays`);
            setHolidays(response.data);
        } catch (error) {
            console.error('Error fetching holidays:', error);
        }
    };

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/vendor/bookings`, {
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
        const confirmed = await showConfirm('Update Status', `Are you sure you want to ${newStatus}?`, 'Confirm', 'Cancel');
        if (!confirmed) return;
        try {
            await axios.post(`${API_BASE_URL}/vendor/bookings/${bookingId}/status`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
            fetchBookings();
            showSuccess('Updated', 'Status updated successfully!');
        } catch (error) {
            showError('Error', 'Failed to update status');
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
        // Next day for end_date logic
        const nextDate = new Date(year, month, day + 1);
        const nextDateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;

        try {
            await axios.post(`${API_BASE_URL}/vendor/bookings/freeze`, {
                property_id: selectedProperty,
                start_date: dateStr,
                end_date: nextDateStr,
                reason: freezeReason || 'Manual Freeze'
            }, { headers: { Authorization: `Bearer ${token}` } });

            fetchBookings();
            setFreezeModalOpen(false);
            showSuccess('Frozen', 'Date successfully frozen/blocked.');
        } catch (error) {
            showError('Freeze Failed', 'Failed to freeze date.');
        }
    };

    const getSelectedPropDetails = () => {
        return properties.find(p => p.PropertyId == selectedProperty) || {};
    };

    const shareProperty = () => {
        const prop = getSelectedPropDetails();
        if (!prop.PropertyId) return;

        const link = `${import.meta.env.VITE_WEBSITE_URL || 'https://beta.resortwala.com'}/property/${prop.PropertyId}`;
        const text = `🏡 *Check out this amazing property: ${prop.Name}*\n📍 ${prop.Location}\n\n🔗 *Book here:* ${link}\n\n✨ Contact us for best rates!`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    const shareAvailability = () => {
        const prop = getSelectedPropDetails();
        if (!prop.PropertyId) return;

        const monthStr = `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
        let text = `📅 *Availability Update: ${prop.Name}*\n🗓️ *${monthStr}*\n\n`;

        const busyDates = [];
        const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
            const booking = isDateBooked(currentMonth.getFullYear(), currentMonth.getMonth(), d);
            if (booking) busyDates.push({ date: d, status: booking.Status === 'blocked' ? 'Frozen ❄️' : 'Booked ✅' });
        }

        if (busyDates.length === 0) text += "✅ All dates available this month!";
        else {
            text += "🔴 *Busy Dates:*\n";
            busyDates.forEach(item => text += `• ${item.date}: ${item.status}\n`);
            text += "\n✅ All other dates empty.";
        }
        text += `\n\n🔗 ${import.meta.env.VITE_WEBSITE_URL || 'https://beta.resortwala.com'}/property/${prop.PropertyId}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    const isDateBooked = (year, month, day) => {
        const checkDate = new Date(year, month, day).setHours(0, 0, 0, 0);
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

    const daysArray = (() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfWeek = new Date(year, month, 1).getDay();
        const arr = [];
        for (let i = 0; i < firstDayOfWeek; i++) arr.push({ type: 'empty', id: `empty-${i}` });
        for (let d = 1; d <= daysInMonth; d++) arr.push({ type: 'day', day: d, date: new Date(year, month, d) });
        return arr;
    })();

    const propDetails = getSelectedPropDetails();

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-color)', overflowX: 'hidden' }}>
            <Sidebar activePage="day-wise-booking" isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

            <div className="main-content">
                {/* Unified Header */}
                <div className="sticky-header">
                    <div className="header-top">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>☰</button>
                            <div>
                                <h1 className="page-title">{propDetails.Name || 'My Availability'}</h1>
                                <p className="page-subtitle">{propDetails.Location || 'Manage your calendar'}</p>
                            </div>
                        </div>
                        <div className="select-wrapper">
                            <select className="styled-select" value={selectedProperty} onChange={e => setSelectedProperty(e.target.value)}>
                                <option value="">Select Property</option>
                                {properties.map(p => <option key={p.PropertyId} value={p.PropertyId}>{p.Name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="action-bar-grid">
                        <button onClick={shareProperty} className="action-btn share-prop">
                            <span className="icon">🏡</span> Share Property
                        </button>
                        <button onClick={shareAvailability} className="action-btn share-cal">
                            <span className="icon">📅</span> Share Calendar
                        </button>
                    </div>

                    <div className="month-nav">
                        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="nav-btn">←</button>
                        <h2 className="month-title">{monthNames[currentMonth.getMonth()]} <span>{currentMonth.getFullYear()}</span></h2>
                        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="nav-btn">→</button>
                    </div>
                </div>

                {/* Calendar Content */}
                <div className="calendar-container">
                    {loading && <div className="loading-overlay"><div className="spinner"></div></div>}

                    {/* Desktop Grid */}
                    <div className="desktop-view">
                        <div className="week-header">
                            {weekDays.map((d, i) => <div key={d} className={`week-day ${i === 0 || i === 6 ? 'weekend' : ''}`}>{d}</div>)}
                        </div>
                        <div className="days-grid">
                            {daysArray.map((item, idx) => {
                                if (item.type === 'empty') return <div key={item.id} className="empty-cell" />;
                                const day = item.day;
                                const booking = isDateBooked(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                                const holiday = isHoliday(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                                const isToday = new Date().toDateString() === item.date.toDateString();
                                const isWeekend = item.date.getDay() === 0 || item.date.getDay() === 6;

                                return (
                                    <div key={day} className={`day-cell ${isToday ? 'today' : ''} ${isWeekend ? 'weekend-bg' : ''}`}
                                        onClick={() => !booking && !holiday && handleFreezeDate(currentMonth.getFullYear(), currentMonth.getMonth(), day)}>
                                        <div className="day-header"><span className={`day-number ${isToday ? 'active' : ''}`}>{day}</span>{holiday && <span>🎉</span>}</div>
                                        {booking && (
                                            <div className={`status-badge ${booking.Status}`}>
                                                {booking.Status === 'blocked' ?
                                                    <><span>❄️ Frozen</span><button className="del-btn" onClick={(e) => { e.stopPropagation(); handleStatusUpdate(booking.BookingId, 'cancelled') }}>×</button></>
                                                    : booking.CustomerName}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Mobile List View */}
                    <div className="mobile-view">
                        {daysArray.filter(d => d.type === 'day').map(item => {
                            const day = item.day;
                            const booking = isDateBooked(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                            const holiday = isHoliday(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                            const isToday = new Date().toDateString() === item.date.toDateString();
                            const isWeekend = item.date.getDay() === 0 || item.date.getDay() === 6;

                            return (
                                <div key={day} className={`mobile-row ${isToday ? 'highlight' : ''}`}>
                                    <div className="date-box">
                                        <span className="big-date">{day}</span>
                                        <span className="small-day">{weekDays[item.date.getDay()]}</span>
                                    </div>
                                    <div className="info-box">
                                        {holiday && <div className="tag holiday">🎉 {holiday.name}</div>}
                                        {booking ? (
                                            booking.Status === 'blocked' ?
                                                <div className="status-row frozen">
                                                    <span>❄️ Frozen</span>
                                                    <button onClick={() => handleStatusUpdate(booking.BookingId, 'cancelled')}>Unfreeze</button>
                                                </div> :
                                                <div className="status-row booked">
                                                    <span className="c-name">{booking.CustomerName}</span>
                                                    <span className="tag booked">{booking.Status}</span>
                                                </div>
                                        ) : (
                                            <div className="available" onClick={() => handleFreezeDate(currentMonth.getFullYear(), currentMonth.getMonth(), day)}>
                                                <span style={{ color: '#10b981' }}>Available</span> <span className="plus">+</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Modal */}
                {isFreezeModalOpen && (
                    <div className="modal-overlay" onClick={() => setFreezeModalOpen(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <h3>Freeze {freezeDetails.day} {monthNames[freezeDetails.month]}</h3>
                            <input className="modal-input" placeholder="Reason" value={freezeReason} onChange={e => setFreezeReason(e.target.value)} />
                            <div className="modal-actions">
                                <button className="btn-sec" onClick={() => setFreezeModalOpen(false)}>Cancel</button>
                                <button className="btn-pri" onClick={submitFreeze}>Freeze It</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                /* General */
                .main-content { flex: 1; margin-left: 70px; background: var(--bg-color); transition: margin-left 0.3s; }
                .main-content:hover { margin-left: 240px; }
                .sticky-header { position: sticky; top: 0; z-index: 100; background: rgba(255,255,255,0.98); border-bottom: 1px solid #eee; padding: 15px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); }
                
                .header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
                .page-title { font-size: 20px; font-weight: 800; margin: 0; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 250px; }
                .page-subtitle { margin: 0; font-size: 13px; color: #64748b; }
                .select-wrapper { min-width: 150px; }
                .styled-select { padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; width: 100%; outline: none; background: white; font-weight: 500; }

                /* Action Bar */
                .action-bar-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; }
                .action-btn { border: none; padding: 12px; border-radius: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 14px; transition: transform 0.2s; }
                .action-btn:active { transform: scale(0.98); }
                .share-prop { background: #eff6ff; color: #2563eb; }
                .share-cal { background: #f0fdf4; color: #16a34a; }
                
                .month-nav { display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 10px; border-radius: 12px; }
                .nav-btn { background: white; border: 1px solid #e2e8f0; width: 32px; height: 32px; border-radius: 6px; cursor: pointer; font-weight: bold; }
                .month-title { margin: 0; font-size: 16px; font-weight: 700; color: #333; }

                /* Desktop Grid */
                .desktop-view { display: block; background: white; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); margin: 20px; overflow: hidden; border: 1px solid #f1f5f9; }
                .week-header { display: grid; grid-template-columns: repeat(7, 1fr); background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
                .week-day { padding: 12px; text-align: center; font-weight: 600; color: #64748b; font-size: 12px; text-transform: uppercase; }
                .weekend { color: #ef4444; }
                .days-grid { display: grid; grid-template-columns: repeat(7, 1fr); background: white; }
                .day-cell { min-height: 110px; border-right: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; padding: 8px; cursor: pointer; transition: bg 0.2s; position: relative; }
                .day-cell:hover { background: #f8fafc; }
                .day-cell.today { background: #f0f9ff; }
                .day-number { font-weight: 600; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 13px; }
                .day-number.active { background: #3b82f6; color: white; }
                
                .status-badge { margin-top: 6px; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 500; display: flex; justify-content: space-between; align-items: center; }
                .status-badge.blocked { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
                .status-badge.confirmed { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
                .status-badge.pending { background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; }
                .del-btn { border: none; background: none; color: inherit; font-size: 14px; cursor: pointer; padding: 0 4px; }

                /* Mobile View */
                .mobile-view { display: none; padding: 10px; }
                .mobile-row { display: flex; background: white; margin-bottom: 10px; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0; align-items: center; gap: 15px; }
                .mobile-row.highlight { border: 2px solid #3b82f6; background: #eff6ff; }
                .date-box { display: flex; flex-direction: column; align-items: center; min-width: 45px; border-right: 2px solid #f1f5f9; padding-right: 15px; }
                .big-date { font-size: 22px; font-weight: 800; color: #1e293b; line-height: 1; }
                .small-day { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-top: 2px; }
                
                .info-box { flex: 1; }
                .tag { display: inline-block; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 700; text-transform: uppercase; }
                .tag.holiday { background: #f1f5f9; color: #64748b; margin-bottom: 4px; }
                .tag.booked { background: #dcfce7; color: #166534; margin-left: auto; }
                
                .status-row { display: flex; justify-content: space-between; align-items: center; width: 100%; }
                .status-row.frozen { color: #ef4444; font-weight: 600; font-size: 14px; }
                .status-row.frozen button { background: white; border: 1px solid #ef4444; color: #ef4444; font-size: 11px; padding: 4px 10px; border-radius: 20px; font-weight: 600; }
                .c-name { font-weight: 600; color: #333; font-size: 14px; }
                
                .available { font-weight: 600; display: flex; align-items: center; justify-content: space-between; cursor: pointer; padding: 5px 0; }
                .plus { background: #dcfce7; color: #15803d; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; }

                .mobile-menu-btn { display: none; background: none; border: none; font-size: 24px; color: #333; cursor: pointer; }

                /* Modal */
                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 2000; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(2px); }
                .modal-content { background: white; width: 90%; max-width: 350px; padding: 25px; border-radius: 20px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
                .modal-input { width: 100%; padding: 12px; margin: 15px 0; border: 1px solid #cbd5e1; border-radius: 8px; }
                .modal-actions { display: flex; gap: 10px; }
                .btn-pri { background: #3b82f6; color: white; flex: 1; padding: 10px; border: none; border-radius: 8px; font-weight: 600; }
                .btn-sec { background: #f1f5f9; color: #475569; flex: 1; padding: 10px; border: none; border-radius: 8px; font-weight: 600; }

                @media (max-width: 768px) {
                    .main-content { margin-left: 0; }
                    .main-content:hover { margin-left: 0; }
                    .mobile-menu-btn { display: block; }
                    .desktop-view { display: none; }
                    .mobile-view { display: block; }
                    .header-top { flex-direction: column; align-items: stretch; gap: 10px; }
                    .header-top > div:first-child { display: flex; justify-content: flex-start; align-items: center; }
                    .select-wrapper { width: 100%; }
                }
            `}</style>
        </div>
    );
}
