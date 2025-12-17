import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
// import axios from 'axios'; // We need a configured axios or fetch
import { FaCheck, FaTimes } from 'react-icons/fa';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

export default function PublicPropertyCalendar() {
    const { uuid } = useParams();
    const [events, setEvents] = useState([]);
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);

    // Booking Form
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');

    useEffect(() => {
        fetchCalendarData();
        // Live updates (Polling every 5s)
        const interval = setInterval(fetchCalendarData, 5000);
        return () => clearInterval(interval);
    }, [uuid]);

    const fetchCalendarData = async () => {
        try {
            // Using fetch to avoid axios config issues in quick setup, assuming /api proxy works
            const res = await fetch(`/api/public/properties/${uuid}/calendar`);
            if (!res.ok) throw new Error('Failed to load');
            const data = await res.json();

            setProperty(data.property);

            const calendarEvents = data.bookings.map(b => ({
                title: b.Status === 'confirmed' ? 'Booked' : 'Locked',
                start: new Date(b.CheckInDate),
                end: new Date(b.CheckOutDate),
                status: b.Status,
                allDay: true
            }));
            setEvents(calendarEvents);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectSlot = ({ start, end }) => {
        // Prevent booking if dates are in past
        if (new Date(start) < new Date().setHours(0, 0, 0, 0)) {
            alert("Cannot book past dates.");
            return;
        }

        setSelectedSlot({ start, end });
        setShowModal(true);
    };

    const handleSubmitRequest = async (e) => {
        e.preventDefault();
        if (!name || !mobile) {
            alert("Please fill all details");
            return;
        }

        try {
            const res = await fetch('/api/public/bookings/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    property_id: property.id,
                    start_date: format(selectedSlot.start, 'yyyy-MM-dd'),
                    end_date: format(selectedSlot.end, 'yyyy-MM-dd'),
                    name,
                    mobile
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Failed');
            }

            alert("Request Sent! The owner will confirm shortly.");
            setShowModal(false);
            setName('');
            setMobile('');
            fetchCalendarData(); // Refresh immediately
        } catch (error) {
            alert("Booking Failed: " + error.message);
        }
    };

    const eventStyleGetter = (event) => {
        let backgroundColor = '#e74c3c'; // Red for Booked/Locked
        if (event.status === 'pending') backgroundColor = '#f39c12'; // Orange for pending
        return { style: { backgroundColor } };
    };

    const [currentDate, setCurrentDate] = useState(new Date());

    const handleNavigate = (newDate) => {
        setCurrentDate(newDate);
    };

    const CustomToolbar = (toolbar) => {
        const goToBack = () => {
            toolbar.onNavigate('PREV');
        };

        const goToNext = () => {
            toolbar.onNavigate('NEXT');
        };

        const goToCurrent = () => {
            toolbar.onNavigate('TODAY');
        };

        const label = () => {
            const date = toolbar.date;
            return (
                <span className="text-xl font-bold text-gray-800 capitalize">
                    {format(date, 'MMMM yyyy')}
                </span>
            );
        };

        return (
            <div className="flex justify-between items-center mb-6 px-2">
                <div className="flex gap-2">
                    <button onClick={goToBack} className="p-2 rounded-full hover:bg-gray-100 transition duration-200" title="Previous Month">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                    </button>
                    <button onClick={goToCurrent} className="px-4 py-1.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition duration-200">
                        Today
                    </button>
                    <button onClick={goToNext} className="p-2 rounded-full hover:bg-gray-100 transition duration-200" title="Next Month">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                </div>
                <div>{label()}</div>
                <div className="w-[100px]"></div> {/* Spacer for alignment */}
            </div>
        );
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-xl text-gray-500">Loading Availability...</div>;

    return (
        <div className="container mx-auto p-4 min-h-screen pt-24 pb-20">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-5xl mx-auto border border-gray-100">
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-8 text-center relative overflow-hidden">
                    <div className="relative z-10">
                        <h1 className="text-3xl font-serif mb-2 tracking-wide text-[#FF385C]">{property?.name}</h1>
                        <p className="text-gray-300 text-sm uppercase tracking-widest font-medium">Availability Calendar</p>
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
                            eventPropGetter={eventStyleGetter}
                            views={['month']}
                            date={currentDate}
                            onNavigate={handleNavigate}
                            components={{
                                toolbar: CustomToolbar
                            }}
                        />
                    </div>

                    <div className="flex gap-4 text-sm justify-center">
                        <div className="flex items-center gap-2"><span className="w-4 h-4 bg-red-500 rounded"></span> Unavailable</div>
                        <div className="flex items-center gap-2"><span className="w-4 h-4 bg-yellow-500 rounded"></span> Request Pending</div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-white border border-gray-300 rounded"></div> Available (Click to Book)</div>
                    </div>
                </div>
            </div>

            {/* Booking Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-8 max-w-md w-full animate-fade-up">
                        <h2 className="text-2xl font-bold mb-4">Request Booking</h2>
                        <p className="mb-4 text-gray-600">
                            {format(selectedSlot.start, 'MMM dd')} - {format(selectedSlot.end, 'MMM dd, yyyy')}
                        </p>

                        <form onSubmit={handleSubmitRequest} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Your Name</label>
                                <input
                                    type="text"
                                    className="w-full border p-2 rounded mt-1"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
                                <input
                                    type="tel"
                                    className="w-full border p-2 rounded mt-1"
                                    value={mobile}
                                    onChange={e => setMobile(e.target.value)}
                                    placeholder="+91 9999999999"
                                    required
                                />
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 border rounded text-gray-600 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
                                >
                                    Send Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
