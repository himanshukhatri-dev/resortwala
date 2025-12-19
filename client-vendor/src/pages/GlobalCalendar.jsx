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
            console.error("Failed to load data", error);
            showError("Error", "Failed to load calendar data.");
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

    const eventStyleGetter = (event) => {
        let backgroundColor = '#3174ad';
        const st = (event.status || '').toLowerCase();

        if (st === 'locked' || st === 'blocked') backgroundColor = '#e74c3c';
        else if (st === 'confirmed') backgroundColor = '#2ecc71';
        else if (st === 'pending') backgroundColor = '#f39c12';
        else if (st === 'cancelled' || st === 'rejected') backgroundColor = '#95a5a6';

        return { style: { backgroundColor, fontSize: '11px', borderRadius: '4px', border: 'none' } };
    };

    const handleNavigate = (newDate) => setCurrentDate(newDate);

    // Custom Toolbar
    const CustomToolbar = (toolbar) => {
        const goToBack = () => toolbar.onNavigate('PREV');
        const goToNext = () => toolbar.onNavigate('NEXT');
        const label = () => (
            <span className="text-xl md:text-2xl font-bold text-gray-800 capitalize min-w-[200px] text-center">
                {format(toolbar.date, 'MMMM yyyy')}
            </span>
        );

        return (
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                {/* Navigation */}
                <div className="flex items-center gap-4 bg-white shadow-sm px-4 py-2 rounded-full border border-gray-100">
                    <button onClick={goToBack} className="p-2 hover:bg-gray-100 rounded-full transition"><FaArrowLeft /></button>
                    {label()}
                    <button onClick={goToNext} className="p-2 hover:bg-gray-100 rounded-full transition"><FaArrowRight /></button>
                </div>

                {/* Filter */}
                <div className="flex items-center gap-2 bg-white shadow-sm px-4 py-2 rounded-full border border-gray-100">
                    <FaFilter className="text-gray-400" />
                    <select
                        value={selectedPropertyId}
                        onChange={(e) => setSelectedPropertyId(e.target.value)}
                        className="bg-transparent outline-none font-medium text-gray-700 min-w-[150px] cursor-pointer"
                    >
                        <option value="all">All Properties</option>
                        {properties.map(p => (
                            <option key={p.id || p.PropertyId} value={p.id || p.PropertyId}>{p.Name || p.ShortName}</option>
                        ))}
                    </select>
                </div>
            </div>
        );
    };

    if (loading && events.length === 0) return <div className="min-h-screen flex items-center justify-center">Loading Calendar...</div>;

    return (
        <div className="container mx-auto p-4 min-h-screen pt-4 pb-20 max-w-7xl">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Master Property Calendar</h1>
                            <p className="text-gray-500 mt-1">Easily track availability and bookings across <span className="font-bold text-blue-600">ALL</span> your managed properties in one unified view.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-500 mr-2 uppercase tracking-wider hidden md:inline">Share Portfolio:</span>

                            <button onClick={() => {
                                const url = `${window.location.origin}/s/m/${user?.id}`;
                                window.open(`https://wa.me/?text=${encodeURIComponent(url)}`, '_blank');
                            }} className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center hover:scale-110 transition shadow-md" title="Share on WhatsApp">
                                <FaWhatsapp size={20} />
                            </button>

                            <button onClick={() => {
                                const url = `${window.location.origin}/s/m/${user?.id}`;
                                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                            }} className="w-10 h-10 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:scale-110 transition shadow-md" title="Share on Facebook">
                                <FaFacebook size={20} />
                            </button>

                            <button onClick={() => {
                                const url = `${window.location.origin}/s/m/${user?.id}`;
                                navigator.clipboard.writeText(url);
                                alert("Link copied! Share this link on your Instagram Story/Bio.");
                            }} className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center hover:scale-110 transition shadow-md" title="Share on Instagram">
                                <FaInstagram size={20} />
                            </button>

                            <button onClick={() => {
                                const url = `${window.location.origin}/s/m/${user?.id}`;
                                navigator.clipboard.writeText(url);
                                showSuccess('Link Copied', 'Portfolio link copied to clipboard!');
                            }} className="w-10 h-10 rounded-full bg-gray-800 text-white flex items-center justify-center hover:scale-110 transition shadow-md" title="Copy Link">
                                <FaCopy size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="h-[700px] mt-6">
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
                                    <div className="flex items-center gap-1 overflow-hidden" title={`${event.title}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-white/50`}></span>
                                        <span className="truncate text-[10px] md:text-xs font-medium">{event.title}</span>
                                    </div>
                                )
                            }}
                        />
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-4 mt-6 justify-center text-sm text-gray-600">
                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[#2ecc71]"></span> Confirmed</div>
                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[#f39c12]"></span> Pending</div>
                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[#e74c3c]"></span> Locked</div>
                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[#95a5a6]"></span> Cancelled</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
