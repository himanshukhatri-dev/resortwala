import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { FaCheck, FaTimes, FaArrowLeft, FaArrowRight } from 'react-icons/fa';

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

            setShowModal(false);
            alert("Request Sent! The owner will confirm shortly.");
            setName('');
            setMobile('');
            fetchCalendarData(); // Refresh immediately
        } catch (error) {
            alert("Booking Failed: " + error.message);
        }
    };

    const eventStyleGetter = (event) => {
        // Transparent for booked items to let CustomEvent handle the look (with logo)
        if (event.status === 'confirmed' || event.status === 'locked') {
            return {
                style: {
                    backgroundColor: 'transparent',
                    padding: 0,
                    outline: 'none',
                    boxShadow: 'none'
                }
            };
        }
        let backgroundColor = '#f39c12'; // Orange for pending
        return { style: { backgroundColor } };
    };

    // Custom coloring for past dates using dayPropGetter
    const dayPropGetter = (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (date < today) {
            return {
                style: {
                    backgroundColor: '#f9fafb',
                    color: '#ccc',
                    pointerEvents: 'none', // Effectively disables clicking
                },
                className: 'past-date'
            };
        }
        return {};
    };

    const CustomEvent = ({ event }) => {
        const isBooked = event.status === 'confirmed' || event.status === 'locked';

        if (isBooked) {
            return (
                <div className="relative w-full h-full group flex items-center justify-center">
                    {/* Fancy Container for Logo - RED Background as requested */}
                    <div className="w-full h-full bg-red-50 border border-red-100 rounded-md overflow-hidden relative flex items-center justify-center">
                        {/* Logo with slight opacity */}
                        <img
                            src="/logo_booked.png"
                            alt="Booked"
                            className="w-auto h-[70%] object-contain opacity-50 transition-transform duration-300 group-hover:scale-110"
                        />
                        {/* Red Overlay for 'Unavailable' feel */}
                        <div className="absolute inset-0 bg-red-100/20 mix-blend-multiply" />
                    </div>

                    {/* HOVER TOOLTIP */}
                    <div className="absolute z-[9999] hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg shadow-xl whitespace-nowrap pointer-events-none">
                        Unavailable / Booked
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
                    </div>
                </div>
            );
        }

        // Default Pending View
        return (
            <div className="w-full h-full flex items-center justify-center text-xs font-bold">
                {event.title}
            </div>
        );
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

        const label = () => {
            const date = toolbar.date;
            return (
                <span className="text-xl md:text-2xl font-bold text-gray-800 capitalize" style={{ minWidth: '200px', textAlign: 'center' }}>
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

    if (loading) return <div className="min-h-screen flex items-center justify-center text-xl text-gray-500">Loading Availability...</div>;

    return (
        <div className="container mx-auto p-2 md:p-4 min-h-screen pt-10 md:pt-24 pb-20">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-5xl mx-auto border border-gray-100">
                {/* Clean Header with Big Logo */}
                <div className="p-4 pb-0 text-center">
                    <div className="flex flex-col items-center justify-center">
                        <div className="w-20 h-20 mb-2 flex items-center justify-center">
                            <img src="/logo_booked.png" alt="ResortWala" className="w-full h-full object-contain drop-shadow-sm" />
                        </div>

                        {/* Clickable Property Name */}
                        <a
                            href={`/property/${property?.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-2xl md:text-3xl font-serif mb-2 tracking-wide text-gray-900 font-bold hover:text-primary underline decoration-dotted decoration-gray-300 hover:decoration-primary transition-all cursor-pointer"
                        >
                            {property?.name}
                        </a>

                        {/* Address & Contact */}
                        <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-gray-500 text-sm mb-4">
                            <span className="flex items-center gap-1.5"><span className="text-lg">📍</span> {property?.Address || property?.Location || "India"}</span>
                            {property?.MobileNo && (
                                <span className="flex items-center gap-1.5"><span className="text-lg">📞</span> {property?.MobileNo}</span>
                            )}
                        </div>

                        {/* Action Link (Just Location) */}
                        <div className="flex flex-wrap justify-center gap-4">
                            {(property?.GoogleMapLink || property?.Location) && (
                                <a
                                    href={property?.GoogleMapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property?.Location)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-6 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full text-xs font-bold transition-all text-gray-600 flex items-center gap-2"
                                >
                                    <span>📍</span> View Location
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-4 md:p-8">
                    <div className="h-[500px] md:h-[600px] mb-8">
                        <Calendar
                            localizer={localizer}
                            events={events}
                            startAccessor="start"
                            endAccessor="end"
                            style={{ height: '100%', minHeight: '500px' }}
                            selectable
                            onSelectSlot={handleSelectSlot}
                            eventPropGetter={eventStyleGetter}
                            dayPropGetter={dayPropGetter}
                            views={['month']}
                            date={currentDate}
                            onNavigate={handleNavigate}
                            components={{
                                toolbar: CustomToolbar,
                                event: CustomEvent
                            }}
                        />
                    </div>

                    <div className="flex gap-4 text-xs md:text-sm justify-center flex-wrap">
                        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-50 border border-red-100 rounded flex items-center justify-center overflow-hidden"><img src="/logo_booked.png" className="w-full h-full object-contain opacity-50" /></div> Unavailable</div>
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
            {/* NON-INTRUSIVE ADVERTISEMENT */}
            <a
                href="/"
                target="_blank"
                className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-md border border-gray-200 shadow-xl px-4 py-2 rounded-full flex items-center gap-3 z-50 hover:scale-105 transition-transform group"
            >
                <div className="w-10 h-10 bg-white border border-gray-100 rounded-full flex items-center justify-center p-1 overflow-hidden">
                    <img src="/logo_booked.png" alt="RW" className="w-full h-full object-contain" />
                </div>
                <div className="text-left">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Powered By</div>
                    <div className="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors">ResortWala</div>
                </div>
            </a>

            <style>{`
                .past-date .rbc-button-link {
                     color: #ccc !important;
                     pointer-events: none;
                }
            `}</style>
        </div>
    );
}
