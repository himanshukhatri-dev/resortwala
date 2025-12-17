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
import { FaWhatsapp, FaLock, FaCheck } from 'react-icons/fa';
import { useModal } from '../context/ModalContext';

const locales = { 'en-US': enUS };

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

export default function VendorCalendar() {
    const { id } = useParams();
    const { token } = useAuth();
    const { showConfirm, showSuccess, showError, showInfo } = useModal();
    const [events, setEvents] = useState([]);
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);

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
            const res = await axios.get(`/api/vendor/properties/${id}/calendar`, {
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
        } finally {
            setLoading(false);
        }
    };

    const handleSelectSlot = async ({ start, end }) => {
        const confirmed = await showConfirm(
            'Lock Dates',
            `Lock dates from ${format(start, 'yyyy-MM-dd')} to ${format(end, 'yyyy-MM-dd')}?`,
            'Lock',
            'Cancel'
        );
        if (!confirmed) return;

        try {
            await axios.post('/api/vendor/bookings/lock', {
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
                    await axios.post(`/api/vendor/bookings/${event.id}/approve`, {}, {
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

    const shareOnWhatsapp = () => {
        if (!property?.share_link) return;
        const message = `Check live availability for ${property.name} here: ${property.share_link}`;
        const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    if (loading) return <div className="p-10 text-center">Loading Calendar...</div>;

    return (
        <div className="p-6 bg-white min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Availability Calendar</h1>
                    <p className="text-gray-500">{property?.name}</p>
                </div>
                <button
                    onClick={shareOnWhatsapp}
                    className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded shadow hover:bg-green-600 transition"
                >
                    <FaWhatsapp /> Share Availability
                </button>
            </div>

            <div className="h-[600px] border p-4 rounded-lg shadow-sm">
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: 500 }}
                    selectable
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={handleSelectEvent}
                    eventPropGetter={eventStyleGetter}
                />
            </div>

            <div className="mt-4 flex gap-4 text-sm" style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '12px', height: '12px', backgroundColor: '#e74c3c', borderRadius: '50%', display: 'inline-block' }}></span>
                    Locked (Owner)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '12px', height: '12px', backgroundColor: '#2ecc71', borderRadius: '50%', display: 'inline-block' }}></span>
                    Confirmed
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '12px', height: '12px', backgroundColor: '#f39c12', borderRadius: '50%', display: 'inline-block' }}></span>
                    Pending Request
                </div>
            </div>
        </div>
    );
}
