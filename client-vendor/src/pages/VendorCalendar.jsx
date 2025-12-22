import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FaWhatsapp, FaLock, FaCheck, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { useModal } from '../context/ModalContext';
import { API_BASE_URL } from '../config';

const locales = { 'en-US': enUS };

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});


import ErrorBoundary from '../components/common/ErrorBoundary';

function VendorCalendarContent() {
    const { id } = useParams();
    const { token } = useAuth();
    const { showConfirm, showSuccess, showError, showInfo } = useModal();
    const [events, setEvents] = useState([]);
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (token) {
            fetchCalendarData();
            // Auto-refresh every 5 seconds ("Live" updates)
            const interval = setInterval(fetchCalendarData, 5000);
            return () => clearInterval(interval);
        }
    }, [id, token]);

    const fetchCalendarData = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/vendor/properties/${id}/calendar`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProperty(res.data.property);

            // Transform bookings to calendar events
            const calendarEvents = res.data.bookings.map(b => {
                const start = new Date(b.CheckInDate);
                const end = new Date(b.CheckOutDate);

                return {
                    id: b.BookingId,
                    title: `${b.Status?.toUpperCase()}: ${b.CustomerName}`,
                    start: start,
                    end: end,
                    status: b.Status,
                    allDay: true,
                    resource: b
                };
            });
            setEvents(calendarEvents);
        } catch (error) {
            console.error("Failed to load calendar", error);
            setError("Failed to load calendar data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectSlot = async ({ start, end }) => {
        // Prevent past dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (start < today) {
            showError('Invalid Selection', 'You cannot lock dates in the past.');
            return;
        }

        const confirmed = await showConfirm(
            'Lock Dates',
            `Lock dates from ${format(start, 'yyyy-MM-dd')} to ${format(end, 'yyyy-MM-dd')}?`,
            'Lock',
            'Cancel'
        );
        if (!confirmed) return;

        try {
            await axios.post(`${API_BASE_URL}/vendor/bookings/lock`, {
                property_id: id,
                start_date: format(start, 'yyyy-MM-dd'),
                end_date: format(end, 'yyyy-MM-dd')
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await showSuccess('Locked', "Dates Locked Successfully!");
            fetchCalendarData(); // Refresh
        } catch (error) {
            showError('Error', "Failed to lock dates: " + (error.response?.data?.message || error.message));
        }
    };

    const handleSelectEvent = async (event) => {
        const currentStatus = (event.status || '').toLowerCase();

        if (currentStatus === 'pending') {
            const confirmed = await showConfirm(
                'Approve Booking',
                `Approve booking for ${event.resource.CustomerName}?`,
                'Approve',
                'Cancel',
                'confirm'
            );

            if (confirmed) {
                try {
                    await axios.post(`${API_BASE_URL}/vendor/bookings/${event.id}/approve`, {}, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    await showSuccess('Confirmed', "Booking Confirmed!");
                    fetchCalendarData();
                } catch (error) {
                    showError('Error', "Failed to approve");
                }
            }
        } else {
            showInfo(
                'Booking Details',
                `Guest: ${event.resource.CustomerName}\nStatus: ${event.resource.Status}\nAmount: ₹${event.resource.TotalAmount}`
            );
        }
    };

    const eventStyleGetter = (event) => {
        let backgroundColor = '#3174ad';
        const st = (event.status || '').toLowerCase();
        if (st === 'locked') backgroundColor = '#e74c3c'; // Red for locked
        if (st === 'confirmed') backgroundColor = '#2ecc71'; // Green for confirmed
        if (st === 'pending') backgroundColor = '#f39c12'; // Orange for pending

        return { style: { backgroundColor } };
    };

    const [currentDate, setCurrentDate] = useState(new Date());

    const handleNavigate = (newDate) => {
        setCurrentDate(newDate);
    };

    const shareOnWhatsapp = () => {
        const token = property?.share_token || property?.id;
        if (!token) return;

        // Use configured Customer App URL, or fallback to localhost for dev
        // For production, ensure VITE_CUSTOMER_APP_URL is set in environment variables
        const customerBase = import.meta.env.VITE_CUSTOMER_APP_URL || 'http://localhost:5173';
        const link = `${customerBase}/stay/${token}`;

        const message = `Check live availability for ${property.name} here: ${link}`;
        const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    // Custom Toolbar from Public Calendar
    const CustomToolbar = (toolbar) => {
        const goToBack = () => {
            toolbar.onNavigate('PREV');
        };

        const goToNext = () => {
            toolbar.onNavigate('NEXT');
        };

        const label = () => {
            const date = toolbar.date;
            return (
                <span className="text-2xl font-bold text-gray-800 capitalize" style={{ minWidth: '200px', textAlign: 'center' }}>
                    {format(date, 'MMMM yyyy')}
                </span>
            );
        };

        return (
            <div className="flex justify-center items-center mb-4 px-2 relative">
                <div className="flex items-center justify-between gap-4 bg-white shadow-sm px-6 py-2 rounded-full border border-gray-100 min-w-[300px]">
                    <button
                        onClick={goToBack}
                        className="p-2 rounded-full hover:bg-gray-100 text-gray-800 hover:text-black transition-all duration-200"
                        title="Previous Month"
                    >
                        <FaArrowLeft size={16} />
                    </button>

                    {label()}

                    <button
                        onClick={goToNext}
                        className="p-2 rounded-full hover:bg-gray-100 text-gray-800 hover:text-black transition-all duration-200"
                        title="Next Month"
                    >
                        <FaArrowRight size={16} />
                    </button>
                </div>
            </div>
        );
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading Calendar...</div>;
    if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
    if (!property) return <div className="min-h-screen flex items-center justify-center">Property Not Found</div>;

    return (
        <div className="container mx-auto p-4 min-h-screen pt-24 pb-20" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-5xl mx-auto border border-gray-100" style={{ backgroundColor: 'white', borderRadius: '1rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', overflow: 'hidden', border: '1px solid #f3f4f6' }}>

                {/* Header Section with Logo */}
                <div className="p-4 pb-0 text-center relative">
                    {/* Share Button (Top Right) */}
                    <button
                        onClick={shareOnWhatsapp}
                        style={{
                            position: 'absolute',
                            top: '1rem',
                            right: '1rem',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            backgroundColor: '#25D366', color: 'white',
                            padding: '8px 16px', borderRadius: '50px',
                            border: 'none', cursor: 'pointer',
                            fontWeight: '600', fontSize: '14px',
                            boxShadow: '0 4px 6px rgba(37, 211, 102, 0.2)',
                            zIndex: 10
                        }}
                    >
                        <FaWhatsapp size={18} /> Share
                    </button>

                    <div className="flex flex-col items-center justify-center mb-2">
                        <img
                            src="/loader-logo.png"
                            alt="ResortWala"
                            style={{
                                height: '60px',
                                width: 'auto',
                                objectFit: 'contain',
                                marginBottom: '0.5rem'
                            }}
                        />
                        <h1 className="text-xl font-bold text-gray-800">{property?.name}</h1>
                        <p className="text-gray-500 text-xs font-medium">Manage Availability</p>
                    </div>
                </div>

                <div className="p-8" style={{ padding: '2rem' }}>
                    <div className="h-[600px] mb-8" style={{ height: '600px', marginBottom: '2rem' }}>
                        <Calendar
                            localizer={localizer}
                            events={events}
                            startAccessor="start"
                            endAccessor="end"
                            style={{ height: 600 }}
                            selectable
                            onSelectSlot={handleSelectSlot}
                            onSelectEvent={handleSelectEvent}
                            eventPropGetter={eventStyleGetter}
                            date={currentDate}
                            onNavigate={handleNavigate}
                            components={{
                                toolbar: CustomToolbar,
                                event: ({ event }) => (
                                    <div className="relative h-full w-full flex items-center px-1 text-xs group overflow-visible">
                                        <div className="font-semibold truncate w-full flex items-center gap-1">
                                            {/* Status Dot */}
                                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${event.status === 'confirmed' ? 'bg-white' :
                                                event.status === 'pending' ? 'bg-yellow-200' : 'bg-red-200'
                                                }`}></span>
                                            <span className="truncate">{event.resource.CustomerName}</span>
                                        </div>

                                        {/* HOVER TOOLTIP - COMPLETELY FLOATING */}
                                        <div className="absolute z-[9999] hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-gray-900 text-white text-xs rounded-xl p-4 shadow-2xl pointer-events-none">
                                            <div className="text-sm font-bold text-white mb-2 border-b border-gray-700 pb-2">{event.resource.CustomerName}</div>
                                            <div className="space-y-1.5 text-gray-300">
                                                <div className="flex justify-between"><span>Status:</span> <span className="capitalize font-medium text-white">{event.resource.Status}</span></div>
                                                <div className="flex justify-between"><span>Mobile:</span> <span className="text-white">{event.resource.CustomerMobile || 'N/A'}</span></div>
                                                <div className="flex justify-between"><span>Guests:</span> <span className="text-white">{event.resource.Guests}</span></div>
                                                <div className="flex justify-between"><span>Amount:</span> <span className="font-bold text-green-400">₹{event.resource.TotalAmount}</span></div>
                                            </div>
                                            {/* Arrow */}
                                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-6 border-r-6 border-t-6 border-l-transparent border-r-transparent border-t-gray-900"></div>
                                        </div>
                                    </div>
                                )
                            }}
                        />
                    </div>

                    <div className="flex gap-4 text-sm justify-center" style={{ display: 'flex', gap: '20px', justifyContent: 'center', fontSize: '0.875rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '16px', height: '16px', backgroundColor: '#e74c3c', borderRadius: '4px' }}></span>
                            Locked (Owner)
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '16px', height: '16px', backgroundColor: '#2ecc71', borderRadius: '4px' }}></span>
                            Confirmed
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '16px', height: '16px', backgroundColor: '#f39c12', borderRadius: '4px' }}></span>
                            Pending Details
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function VendorCalendar() {
    return (
        <ErrorBoundary>
            <VendorCalendarContent />
        </ErrorBoundary>
    );
}

