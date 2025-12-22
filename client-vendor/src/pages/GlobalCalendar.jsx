import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { FaArrowLeft, FaArrowRight, FaFilter, FaShareAlt, FaWhatsapp, FaFacebook, FaInstagram, FaCopy } from 'react-icons/fa';
import { useModal } from '../context/ModalContext';

const locales = { 'en-US': enUS };

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

export default function GlobalCalendar() {
    const { token, user } = useAuth();
    const { showConfirm, showSuccess, showError, showInfo } = useModal();
    const navigate = useNavigate();

    const [events, setEvents] = useState([]);
    const [allBookings, setAllBookings] = useState([]);
    const [properties, setProperties] = useState([]);
    const [selectedPropertyId, setSelectedPropertyId] = useState('all');
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());

    const handleNavigate = (newDate) => {
        setCurrentDate(newDate);
    };

    useEffect(() => {
        if (token) {
            fetchData();
        }
    }, [token]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [propsRes, bookingsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/vendor/properties`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_BASE_URL}/vendor/bookings`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            setProperties(propsRes.data);
            setAllBookings(bookingsRes.data);
        } catch (error) {
            console.error("Failed to load calendar data", error);
            const msg = error.response?.data?.message || error.message;
            console.error("API Response:", error.response);
            showError("Calendar Error", `Failed to load data: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    // Filter and Transform Data
    useEffect(() => {
        let filtered = allBookings;
        if (selectedPropertyId !== 'all') {
            filtered = allBookings.filter(b => b.property?.id == selectedPropertyId || b.property?.PropertyId == selectedPropertyId); // Handle potential ID naming mismatch
        }

        const calendarEvents = filtered.map(b => {
            // Basic validation
            if (!b.CheckInDate || !b.CheckOutDate) return null;

            const start = new Date(b.CheckInDate);
            const end = new Date(b.CheckOutDate);
            const propertyName = b.property?.Name || b.property?.ShortName || 'Unknown Property';

            return {
                id: b.BookingId,
                title: `${b.Status?.slice(0, 3).toUpperCase()} - ${b.CustomerName} (${propertyName})`,
                start: start,
                end: end,
                status: b.Status,
                allDay: true,
                resource: b,
                propertyName: propertyName
            };
        }).filter(Boolean);

        setEvents(calendarEvents);
    }, [allBookings, selectedPropertyId]);


    const handleSelectSlot = async ({ start, end }) => {
        // Prevent past dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (start < today) {
            showError('Invalid Selection', 'You cannot lock dates in the past.');
            return;
        }

        if (selectedPropertyId === 'all') {
            showError('Select Property', 'Please select a specific property from the filter above to lock dates.');
            return;
        }

        const confirmed = await showConfirm(
            'Freeze Dates',
            `Freeze availability from ${format(start, 'yyyy-MM-dd')} to ${format(end, 'yyyy-MM-dd')}?`,
            'Freeze',
            'Cancel'
        );
        if (!confirmed) return;

        try {
            await axios.post(`${API_BASE_URL}/vendor/bookings/lock`, {
                property_id: selectedPropertyId,
                start_date: format(start, 'yyyy-MM-dd'),
                end_date: format(end, 'yyyy-MM-dd')
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await showSuccess('Frozen', "Dates Frozen Successfully!");
            fetchData(); // Refresh
        } catch (error) {
            showError('Error', "Failed to freeze dates: " + (error.response?.data?.message || error.message));
        }
    };

    const handleSelectEvent = (event) => {
        showInfo(
            'Booking Details',
            `Property: ${event.propertyName}\nGuest: ${event.resource.CustomerName}\nDates: ${format(event.start, 'MMM dd')} - ${format(event.end, 'MMM dd')}\nStatus: ${event.resource.Status}\nAmount: ₹${event.resource.TotalAmount}`
        );
    };

    // Custom Styles for RBC
    const styles = `
        .rbc-calendar { font-family: 'Inter', sans-serif; background: #fff; border: none; }
        .rbc-month-view { border: 1px solid #eee; border-radius: 16px; overflow: hidden; }
        .rbc-header { padding: 12px; font-weight: 700; color: #6b7280; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #eee; background: #f9fafb; }
        .rbc-day-bg { border-left: 1px solid #f3f4f6; }
        .rbc-off-range-bg { background: #fcfcfc; }
        .rbc-date-cell { padding: 8px; font-size: 12px; font-weight: 600; color: #374151; }
        .rbc-event { border-radius: 6px; padding: 2px 5px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.05); }
        .rbc-today { background-color: #f0fdf4; }
        .rbc-current-time-indicator { display: none; }
        .rbc-toolbar-label { font-size: 1.25rem; font-weight: 800; color: #111827; }
        .rbc-btn-group button { border: none; background: #f3f4f6; color: #4b5563; font-weight: 600; padding: 6px 12px; border-radius: 8px; margin: 0 2px; }
        .rbc-btn-group button.rbc-active { background: #000; color: #fff; shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .rbc-btn-group button:hover { background: #e5e7eb; }
    `;

    // Event Styler
    const eventStyleGetter = (event) => {
        let backgroundColor = '#3b82f6'; // Default Blue
        let color = '#fff';
        let borderLeft = '4px solid #1d4ed8';

        const st = (event.status || '').toLowerCase();

        if (st === 'locked' || st === 'blocked') {
            backgroundColor = '#fee2e2'; // Light Red
            color = '#991b1b'; // Dark Red
            borderLeft = '4px solid #ef4444';
        }
        else if (st === 'confirmed') {
            backgroundColor = '#dcfce7'; // Light Green
            color = '#166534'; // Dark Green
            borderLeft = '4px solid #22c55e';
        }
        else if (st === 'pending') {
            backgroundColor = '#fef3c7'; // Light Yellow
            color = '#92400e'; // Dark Yellow
            borderLeft = '4px solid #f59e0b';
        }
        else if (st === 'cancelled' || st === 'rejected') {
            backgroundColor = '#f3f4f6'; // Gray
            color = '#6b7280';
            borderLeft = '4px solid #9ca3af';
        }

        return {
            style: {
                backgroundColor,
                color,
                fontSize: '11px',
                borderRadius: '6px',
                border: 'none',
                borderLeft,
                padding: '4px 6px',
                fontWeight: '600',
                marginBottom: '2px'
            }
        };
    };

    const CustomToolbar = (toolbar) => {
        const goToBack = () => { toolbar.onNavigate('PREV'); };
        const goToNext = () => { toolbar.onNavigate('NEXT'); };
        const label = () => {
            const date = toolbar.date;
            return (
                <span className="text-lg font-bold text-gray-800 capitalize">
                    {format(date, 'MMMM yyyy')}
                </span>
            );
        };

        return (
            <div className="flex justify-between items-center mb-4 px-2">
                <div className="flex items-center gap-4">
                    <button onClick={goToBack} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-black">
                        <FaArrowLeft />
                    </button>
                    {label()}
                    <button onClick={goToNext} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-black">
                        <FaArrowRight />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="container mx-auto p-4 md:p-8 min-h-screen max-w-7xl animate-fade-in-up">
            <style>{styles}</style>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Availability Calendar</h1>
                    <p className="text-gray-500 max-w-2xl text-sm md:text-base leading-relaxed">
                        Manage your property availability, view bookings, and freeze dates instantly.
                        Select a property below to filter the view.
                    </p>
                </div>

                {/* Share Button Dynamic */}
                <button
                    onClick={() => {
                        let url = '';
                        let msg = '';

                        if (selectedPropertyId === 'all') {
                            url = `${window.location.origin}/vendor/s/m/${user?.id}`;
                            msg = 'Portfolio Link copied!';
                        } else {
                            // Find property to get token
                            const prop = properties.find(p => (p.id || p.PropertyId) == selectedPropertyId);
                            const token = prop?.share_token || prop?.id || prop?.PropertyId;
                            // Use Customer App URL or fallback
                            const customerBase = import.meta.env.VITE_CUSTOMER_APP_URL || 'http://localhost:5173';
                            url = `${customerBase}/stay/${token}`;
                            msg = 'Property Link copied!';
                        }

                        if (navigator.clipboard) {
                            navigator.clipboard.writeText(url).then(() => showSuccess('Copied', msg));
                        } else {
                            prompt("Copy Link:", url);
                        }
                    }}
                    className="flex items-center gap-2 bg-black text-white px-5 py-3 rounded-xl font-bold hover:bg-gray-800 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                    <FaShareAlt /> {selectedPropertyId === 'all' ? 'Share Portfolio' : 'Share Property'}
                </button>
            </div>

            {/* Main Calendar Card */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-4 md:p-8">

                    {/* Controls Row */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        {/* Property Filter */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400">
                                <FaFilter />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Viewing availability for</label>
                                <select
                                    value={selectedPropertyId}
                                    onChange={(e) => setSelectedPropertyId(e.target.value)}
                                    className="bg-transparent font-bold text-gray-900 outline-none cursor-pointer border-b border-dashed border-gray-400 pb-0.5 hover:border-black transition"
                                >
                                    <option value="all">All Properties</option>
                                    {properties.map(p => (
                                        <option key={p.id || p.PropertyId} value={p.id || p.PropertyId}>{p.Name || p.ShortName}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="flex flex-wrap gap-3 text-xs font-bold text-gray-600">
                            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm"><span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]"></span> Confirmed</div>
                            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm"><span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></span> Pending</div>
                            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm"><span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></span> Frozen</div>
                        </div>
                    </div>

                    {/* Calendar Component */}
                    <div className="h-[650px] md:h-[750px] booking-calendar-wrapper">
                        {loading && events.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 pb-20">
                                <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-4"></div>
                                <p className="text-sm font-medium">Loading Schedule...</p>
                            </div>
                        ) : (
                            <Calendar
                                localizer={localizer}
                                events={events}
                                startAccessor="start"
                                endAccessor="end"
                                style={{ height: '100%' }}
                                eventPropGetter={eventStyleGetter}
                                date={currentDate}
                                onNavigate={handleNavigate}
                                onSelectEvent={handleSelectEvent}
                                selectable
                                onSelectSlot={handleSelectSlot}
                                components={{
                                    toolbar: CustomToolbar,
                                    event: ({ event }) => (
                                        <div className="flex items-center gap-1.5 overflow-hidden leading-tight" title={event.title}>
                                            <span className="truncate">{event.title}</span>
                                        </div>
                                    )
                                }}
                                tooltipAccessor="title"
                            />
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-8 text-center text-gray-400 text-xs">
                <p>Click on any date range to <span className="font-bold text-gray-600">Freeze Availability</span>. Click on a booking to view details.</p>
            </div>
        </div>
    );
}
