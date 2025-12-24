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
    const { id: paramId } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    const { showConfirm, showSuccess, showError, showInfo } = useModal();

    // State
    const [properties, setProperties] = useState([]);
    const [selectedPropertyId, setSelectedPropertyId] = useState(paramId || '');
    const [events, setEvents] = useState([]);
    const [currentProperty, setCurrentProperty] = useState(null);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    // 1. Fetch List of Properties on Mount
    useEffect(() => {
        if (token) {
            fetchProperties();
        }
    }, [token]);

    const fetchProperties = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/vendor/properties`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const props = res.data.properties || [];
            setProperties(props);

            // If paramId exists, ensure it's selected. 
            // If NOT, and list has items, force user to select (don't auto-select to force clarity as requested)
            // Or maybe auto-select first one if desired? User said "ask property to be compulsory param", implies active choice.
            // We will let them choose.

            setInitialLoading(false);
        } catch (error) {
            console.error("Failed to load properties", error);
            setInitialLoading(false);
        }
    };

    // 2. Fetch Calendar Data whenever selectedPropertyId changes
    useEffect(() => {
        if (selectedPropertyId && token) {
            fetchCalendarData(selectedPropertyId);
            // Optionally update URL without reload if needed, or just stay on /vendor/calendar
        } else {
            setEvents([]);
            setCurrentProperty(null);
        }
    }, [selectedPropertyId, token]);

    // Live Refresh
    useEffect(() => {
        if (selectedPropertyId && token) {
            const interval = setInterval(() => fetchCalendarData(selectedPropertyId), 8000);
            return () => clearInterval(interval);
        }
    }, [selectedPropertyId, token]);

    const fetchCalendarData = async (propId) => {
        // Don't set global loading on refresh to avoid UI flicker
        if (!currentProperty) setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/vendor/properties/${propId}/calendar`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCurrentProperty(res.data.property);

            // Transform bookings to calendar events
            const calendarEvents = res.data.bookings.map(b => {
                const start = new Date(b.CheckInDate);
                const end = new Date(b.CheckOutDate);
                // Fix for end date exclusive in some calendars (optional, but standard logic):
                // If using 'day' precision, end date often needs to be +1 for visual or handled by 'endAccessor'.
                // Using React-Big-Calendar, end date is exclusive. 
                // We'll keep raw dates for now.

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
        } finally {
            setLoading(false);
        }
    };

    const handleSelectSlot = async ({ start, end }) => {
        if (!selectedPropertyId) return showError('Select Property', 'Please select a property first.');

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
                property_id: selectedPropertyId,
                start_date: format(start, 'yyyy-MM-dd'),
                end_date: format(end, 'yyyy-MM-dd')
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await showSuccess('Locked', "Dates Locked Successfully!");
            fetchCalendarData(selectedPropertyId);
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
                    fetchCalendarData(selectedPropertyId);
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
        if (st === 'locked') backgroundColor = '#e74c3c'; // Red
        if (st === 'confirmed') backgroundColor = '#2ecc71'; // Green
        if (st === 'pending') backgroundColor = '#f39c12'; // Orange

        return { style: { backgroundColor } };
    };

    const [currentDate, setCurrentDate] = useState(new Date());

    const shareOnWhatsapp = () => {
        if (!currentProperty) return;
        const token = currentProperty.share_token || currentProperty.id;
        if (!token) return;
        const customerBase = import.meta.env.VITE_CUSTOMER_APP_URL || 'http://localhost:5173';
        const link = `${customerBase}/stay/${token}`;
        const message = `Check live availability for ${currentProperty.name} here: ${link}`;
        const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    // Toolbar
    const CustomToolbar = (toolbar) => {
        const goToBack = () => toolbar.onNavigate('PREV');
        const goToNext = () => toolbar.onNavigate('NEXT');
        return (
            <div className="flex justify-center items-center mb-4 px-2 relative">
                <div className="flex items-center justify-between gap-4 bg-white shadow-sm px-6 py-2 rounded-full border border-gray-100 min-w-[300px]">
                    <button onClick={goToBack} className="p-2 rounded-full hover:bg-gray-100 text-gray-800"><FaArrowLeft size={16} /></button>
                    <span className="text-xl font-bold text-gray-800 capitalize" style={{ minWidth: '180px', textAlign: 'center' }}>
                        {format(toolbar.date, 'MMMM yyyy')}
                    </span>
                    <button onClick={goToNext} className="p-2 rounded-full hover:bg-gray-100 text-gray-800"><FaArrowRight size={16} /></button>
                </div>
            </div>
        );
    };

    if (initialLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <div className="container mx-auto p-4 min-h-screen pt-24 pb-20 max-w-7xl">

            {/* PROPERTY SELECTOR */}
            <div className="mb-6 flex justify-center">
                <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex items-center gap-4 w-full max-w-2xl">
                    <label className="font-bold text-gray-700 whitespace-nowrap">Select Property:</label>
                    <select
                        value={selectedPropertyId}
                        onChange={(e) => {
                            setSelectedPropertyId(e.target.value);
                            // Optionally navigate to URL: navigate(`/vendor/calendar/${e.target.value}`)
                        }}
                        className="flex-1 p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                        <option value="">-- Choose a Villa / Hotel --</option>
                        {properties.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.Location})</option>
                        ))}
                    </select>
                </div>
            </div>

            {selectedPropertyId && currentProperty ? (
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-5xl mx-auto border border-gray-100">
                    {/* Header Section with Logo */}
                    <div className="p-4 pb-0 text-center relative">
                        <button onClick={shareOnWhatsapp} className="absolute top-4 right-4 flex items-center gap-2 bg-[#25D366] text-white px-4 py-2 rounded-full font-bold text-sm shadow hover:bg-[#20bd5a] transition">
                            <FaWhatsapp size={18} /> Share
                        </button>

                        <div className="flex flex-col items-center justify-center mb-2">
                            {/* Display Logic for Logo/Title */}
                            <h1 className="text-xl font-bold text-gray-800">{currentProperty.name}</h1>
                            <p className="text-gray-500 text-xs font-medium">Manage Availability</p>
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="h-[600px] mb-8">
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
                                onNavigate={(date) => setCurrentDate(date)}
                                components={{
                                    toolbar: CustomToolbar,
                                    event: ({ event }) => (
                                        <div className="relative h-full w-full flex items-center px-1 text-xs group overflow-visible">
                                            <div className="font-semibold truncate w-full flex items-center gap-1">
                                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${event.status === 'confirmed' ? 'bg-white' : event.status === 'pending' ? 'bg-blue-200' : 'bg-red-200'}`}></span>
                                                <span className="truncate">{event.resource.CustomerName}</span>
                                            </div>
                                            {/* Tooltip */}
                                            <div className="absolute z-[9999] hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-gray-900 text-white text-xs rounded-xl p-4 shadow-2xl pointer-events-none">
                                                <div className="text-sm font-bold text-white mb-2 border-b border-gray-700 pb-2">{event.resource.CustomerName}</div>
                                                <div className="space-y-1.5 text-gray-300">
                                                    <div className="flex justify-between"><span>Status:</span> <span className="capitalize font-medium text-white">{event.resource.Status}</span></div>
                                                    <div className="flex justify-between"><span>Mobile:</span> <span className="text-white">{event.resource.CustomerMobile || 'N/A'}</span></div>
                                                    <div className="flex justify-between"><span>Guests:</span> <span className="text-white">{event.resource.Guests}</span></div>
                                                    <div className="flex justify-between"><span>Amount:</span> <span className="font-bold text-green-400">₹{event.resource.TotalAmount}</span></div>
                                                </div>
                                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-6 border-r-6 border-t-6 border-l-transparent border-r-transparent border-t-gray-900"></div>
                                            </div>
                                        </div>
                                    )
                                }}
                            />
                        </div>

                        <div className="flex gap-4 text-sm justify-center">
                            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-[#e74c3c]"></span> Locked (Owner)</div>
                            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-[#2ecc71]"></span> Confirmed</div>
                            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-[#f39c12]"></span> Pending Approval</div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-20 text-gray-500">
                    <p className="text-xl font-medium">Please select a property from the dropdown above to view its calendar.</p>
                </div>
            )}
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

