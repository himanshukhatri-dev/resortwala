import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import axios from 'axios';
import { FaWhatsapp, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { API_BASE_URL } from '../config';

const locales = { 'en-US': enUS };

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

export default function AdminCalendar() {
    const [properties, setProperties] = useState([]);
    const [selectedPropertyId, setSelectedPropertyId] = useState('');
    const [events, setEvents] = useState([]);
    const [currentProperty, setCurrentProperty] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch ALL Properties for Dropdown
    useEffect(() => {
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        try {
            // Admin endpoint to get all properties
            const res = await axios.get(`${API_BASE_URL}/admin/properties`);
            setProperties(res.data.properties || res.data || []);
            setLoading(false);
        } catch (error) {
            console.error("Failed to load properties", error);
            setLoading(false);
        }
    };

    // Fetch Calendar Data
    useEffect(() => {
        if (selectedPropertyId) {
            fetchCalendarData(selectedPropertyId);
        } else {
            setEvents([]);
            setCurrentProperty(null);
        }
    }, [selectedPropertyId]);

    const fetchCalendarData = async (propId) => {
        try {
            // Re-using vendor endpoint structure or admin specific if available. 
            // Often admins can hit the same GET endpoint if RBAC allows, or use dedicated `/admin/properties/:id/calendar`.
            // Assuming admin has access to view specific property calendar.
            const res = await axios.get(`${API_BASE_URL}/admin/properties/${propId}/calendar`);

            // If the specific admin endpoint doesn't return the same shape, fallback to manual mapping.
            // Assuming response: { property: {}, bookings: [] }
            setCurrentProperty(res.data.property);

            const calendarEvents = (res.data.bookings || []).map(b => ({
                id: b.BookingId,
                title: `${b.Status?.toUpperCase()}: ${b.CustomerName}`,
                start: new Date(b.CheckInDate),
                end: new Date(b.CheckOutDate),
                status: b.Status,
                allDay: true,
                resource: b
            }));
            setEvents(calendarEvents);
        } catch (error) {
            console.error("Failed to load calendar", error);
        }
    };

    const eventStyleGetter = (event) => {
        let backgroundColor = '#3174ad';
        const st = (event.status || '').toLowerCase();
        if (st === 'locked') backgroundColor = '#e74c3c';
        if (st === 'confirmed') backgroundColor = '#2ecc71';
        if (st === 'pending') backgroundColor = '#f39c12';
        return { style: { backgroundColor } };
    };

    const handleSelectEvent = (event) => {
        // Admin View - Just show details for now, or added functionality to force-approve?
        // Simple alert for detail view
        alert(
            `Booking Details:\n\nGuest: ${event.resource.CustomerName}\nMobile: ${event.resource.CustomerMobile}\nStatus: ${event.resource.Status}\nAmount: ₹${event.resource.TotalAmount}`
        );
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

    if (loading) return <div className="p-8 text-center">Loading Admin Calendar...</div>;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="mb-6 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Master Calendar</h1>
                <div className="w-72">
                    <select
                        value={selectedPropertyId}
                        onChange={(e) => setSelectedPropertyId(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">-- Select Property --</option>
                        {properties.map(p => (
                            <option key={p.id || p.PropertyId} value={p.id || p.PropertyId}>{p.name || p.Name} ({p.location || p.Location})</option>
                        ))}
                    </select>
                </div>
            </div>

            {selectedPropertyId && currentProperty ? (
                <div className="bg-white rounded-xl shadow-lg p-6 h-[700px]">
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%' }}
                        onSelectEvent={handleSelectEvent}
                        eventPropGetter={eventStyleGetter}
                        components={{
                            toolbar: CustomToolbar
                        }}
                    />
                </div>
            ) : (
                <div className="flex items-center justify-center h-[500px] bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
                    <p className="text-gray-400 font-medium">Select a property to view its schedule</p>
                </div>
            )}
        </div>
    );
}
