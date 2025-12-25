import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { FaCheck, FaTimes, FaArrowLeft, FaArrowRight, FaMapMarkerAlt, FaExternalLinkAlt, FaWhatsapp } from 'react-icons/fa';

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
    const [showSuccessModal, setShowSuccessModal] = useState(false); // New Success Modal
    const [requestDetails, setRequestDetails] = useState(null); // Store details for WhatsApp msg
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [showMap, setShowMap] = useState(false); // Toggle for map view

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
            const res = await fetch(`${API_BASE_URL}/public/properties/${uuid}/calendar`);
            if (!res.ok) throw new Error('Failed to load');
            const data = await res.json();

            setProperty(data.property);
            if (data.property?.name) document.title = `Book ${data.property.name} | Availability Calendar`;

            // Process bookings into SINGLE DAY events so the logo appears on EACH block
            // Process bookings into SINGLE DAY events
            const processedEvents = [];

            // 1. Generate Rates for the next 6 months (Availability/Price Info)
            // We'll generate these as background/low-priority events
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const endGen = new Date();
            endGen.setMonth(endGen.getMonth() + 6);

            const holidays = data.holidays || [];
            const priceMonThu = parseFloat(data.property.price_mon_thu || 0);
            const priceFriSun = parseFloat(data.property.price_fri_sun || 0);

            for (let d = new Date(today); d <= endGen; d.setDate(d.getDate() + 1)) {
                const dateStr = format(d, 'yyyy-MM-dd');
                const day = d.getDay();

                // Check holiday
                const holiday = holidays.find(h => {
                    const start = new Date(h.from_date);
                    const end = new Date(h.to_date);
                    start.setHours(0, 0, 0, 0); end.setHours(0, 0, 0, 0);
                    const current = new Date(d);
                    current.setHours(0, 0, 0, 0);
                    return current >= start && current <= end;
                });

                let price = priceMonThu;
                if (holiday) {
                    price = parseFloat(holiday.base_price);
                } else {
                    if (day === 0 || day === 5 || day === 6) price = priceFriSun; // Fri,Sat,Sun as weekend here or stricter? 
                    // Usually Fri, Sat, Sun are weekend rates in previous logic. 
                    // Holiday.jsx used: Sat=SatPrice, Fri/Sun=FriSunPrice. 
                    // PublicController returns price_mon_thu and price_fri_sun. 
                    // Let's stick to simple Mon-Thu vs Fri-Sun logic unless we have specific Sat price in API response (we don't explicitely see it in property object usage above, except fallback).
                }

                processedEvents.push({
                    title: `₹${price}`,
                    start: new Date(d),
                    end: new Date(d),
                    allDay: true,
                    type: 'rate',
                    status: 'available'
                });
            }

            // 2. Overlay Bookings (These will visually override rates if we treat them right, or share space)
            data.bookings.forEach(b => {
                const startDate = parse(b.CheckInDate, 'yyyy-MM-dd', new Date());
                const endDate = parse(b.CheckOutDate, 'yyyy-MM-dd', new Date());

                let currentDate = new Date(startDate);
                while (currentDate < endDate) {
                    // Find if we already added a rate event for this day and remove it? 
                    // Or just add booking event. If we add booking, we might want to HIDE the rate or show it crossed out?
                    // For "Availability Calendar", usually showing "Booked" is enough.

                    // Simple approach: Add booking event. In render, Booking takes specific style.
                    // If we want to replace the rate event, we can filter processedEvents.
                    // But simpler: The calendar will render both if they exist.
                    // We can filter out the 'rate' event for this day to avoid clutter.
                    const dStr = format(currentDate, 'yyyy-MM-dd');
                    const rateIndex = processedEvents.findIndex(e => e.type === 'rate' && format(e.start, 'yyyy-MM-dd') === dStr);
                    if (rateIndex !== -1) {
                        processedEvents.splice(rateIndex, 1); // Remove rate, replace with booking
                    }

                    processedEvents.push({
                        title: b.Status === 'confirmed' ? 'Booked' : 'Locked',
                        start: new Date(currentDate),
                        end: new Date(currentDate),
                        status: b.Status,
                        allDay: true,
                        type: 'booking'
                    });
                    currentDate.setDate(currentDate.getDate() + 1);
                }
            });
            setEvents(processedEvents);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectSlot = ({ start, end }) => {
        if (new Date(start) < new Date().setHours(0, 0, 0, 0)) {
            alert("Cannot book past dates.");
            return;
        }
        setSelectedSlot({ start, end });
        setShowModal(true);
    };

    const handleSelectEvent = (event) => {
        // Allow clicking on 'rate' events to book that specific day
        if (event.type === 'rate' || event.status === 'available') {
            if (new Date(event.start) < new Date().setHours(0, 0, 0, 0)) {
                return;
            }
            // For single day click, start=event.start, end=event.end (which is same day usually in this view)
            // BigCalendar ends are exclusive or inclusive depending on view, but for Month view event click:
            // We want to book just this day? Or let them pick range?
            // Usually clicking an event implies that single unit. 
            // Let's set start and end to that day so it pre-selects 1 day.
            // Adjust end date to be next day for logic or keep same?
            // handleSelectSlot usually gives start 00:00 and end 00:00 of next day for single click.

            const start = new Date(event.start);
            const end = new Date(event.start); // Same day
            // If we want 1 night, end should be start + 1 day?
            // For now, let's just use the event's dates. 
            // In loop: start=d, end=d. 

            // Fix: UI expects start/end. 
            setSelectedSlot({ start, end });
            setShowModal(true);
        }
    };

    const handleSubmitRequest = async (e) => {
        e.preventDefault();
        if (!name || !mobile) {
            alert("Please fill all details");
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/public/bookings/request`, {
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

            // Prepare details for Success Modal & WhatsApp
            setRequestDetails({
                name,
                mobile,
                startDate: format(selectedSlot.start, 'dd MMM'),
                endDate: format(selectedSlot.end, 'dd MMM'),
                property: property?.name || 'Villa'
            });
            setShowSuccessModal(true);

            setName('');
            setMobile('');
            fetchCalendarData(); // Refresh immediately
        } catch (error) {
            alert("Booking Failed: " + error.message);
        }
    };

    const eventStyleGetter = (event) => {
        // If it's a rate/available slot, make it transparent (or white)
        // because CustomEvent handles the rendering
        if (event.type === 'rate' || event.status === 'available') {
            return {
                style: {
                    backgroundColor: 'transparent',
                    padding: 0,
                    outline: 'none',
                    boxShadow: 'none'
                }
            };
        }

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
        let backgroundColor = '#f39c12'; // Orange for pending/other
        return { style: { backgroundColor } };
    };

    const dayPropGetter = (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (date < today) {
            return {
                style: {
                    backgroundColor: '#f9fafb',
                    color: '#ccc',
                    pointerEvents: 'none',
                },
                className: 'past-date'
            };
        }
        return {};
    };

    const CustomEvent = ({ event }) => {
        const isBooked = event.type === 'booking';

        if (isBooked) {
            return (
                <div className="relative w-full h-full group flex items-center justify-center">
                    <div className="w-full h-full bg-red-50 border border-red-100 rounded-md overflow-hidden relative flex items-center justify-center">
                        <img
                            src="/logo_booked.png"
                            alt="Booked"
                            className="w-3 h-3 md:w-4 md:h-4 object-contain opacity-60"
                        />
                        <div className="absolute inset-0 bg-red-100/10 mix-blend-multiply" />
                    </div>
                </div>
            );
        }

        // Rate Display (Light)
        if (event.type === 'rate') {
            return (
                <div className="w-full h-full flex items-end justify-center pb-1">
                    <span className="text-[10px] md:text-xs font-bold text-gray-400 opacity-75">{event.title}</span>
                </div>
            );
        }

        return null;
    };

    const [currentDate, setCurrentDate] = useState(new Date());

    const handleNavigate = (newDate) => {
        setCurrentDate(newDate);
    };

    const CustomToolbar = (toolbar) => {
        const goToBack = () => toolbar.onNavigate('PREV');
        const goToNext = () => toolbar.onNavigate('NEXT');
        return (
            <div className="flex justify-center items-center mb-4 px-2 relative">
                <div className="flex items-center justify-between gap-4 bg-white shadow-sm px-6 py-2 rounded-full border border-gray-100 min-w-[300px]">
                    <button onClick={goToBack} className="p-2 rounded-full hover:bg-gray-100 text-gray-800"><FaArrowLeft size={16} /></button>
                    <span className="text-xl md:text-2xl font-bold text-gray-800 capitalize text-center min-w-[200px]">{format(toolbar.date, 'MMMM yyyy')}</span>
                    <button onClick={goToNext} className="p-2 rounded-full hover:bg-gray-100 text-gray-800"><FaArrowRight size={16} /></button>
                </div>
            </div>
        );
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-xl text-gray-500">Loading Availability...</div>;

    // Helper to get embed URL
    const getMapEmbedUrl = (link, location) => {
        if (link && link.includes('google.com/maps')) {
            return `https://www.google.com/maps?q=${encodeURIComponent(location)}&output=embed`;
        }
        return `https://www.google.com/maps?q=${encodeURIComponent(location || 'India')}&output=embed`;
    };

    return (
        <div className="h-screen flex flex-col bg-white overflow-hidden">
            {/* COMPACT CLEAN HEADER */}
            <div className="flex-none p-2 border-b border-gray-100 bg-white z-20 shadow-sm">
                <div className="flex items-center justify-between max-w-7xl mx-auto w-full px-2 md:px-4">
                    {/* Left: Branding */}
                    <div className="flex items-center gap-3">
                        {/* Smaller Header Logo */}
                        <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-gray-50 rounded-lg p-1">
                            <img src="/logo_booked.png" alt="ResortWala" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex flex-col">
                            {/* INSTUCTIONAL TITLE */}
                            <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-0.5">
                                Check Availability & Book
                            </p>
                            <Link to={`/property/${property?.id}`} target="_blank" className="hover:underline group">
                                <h1 className="text-lg md:text-2xl font-extrabold text-gray-900 leading-none truncate max-w-[200px] md:max-w-xl group-hover:text-gray-700 transition">
                                    {property?.name}
                                </h1>
                            </Link>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 truncate max-w-[200px] md:max-w-md">
                                <FaMapMarkerAlt className="text-red-500" /> {property?.location || property?.city || "India"}
                                <span className="hidden md:inline mx-1">•</span>
                                <span className="hidden md:inline text-gray-400">Select dates below to request booking</span>
                            </p>
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2">
                        {/* Map Toggle (Mobile/Desktop) */}
                        <button
                            onClick={() => setShowMap(!showMap)}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-transparent rounded-full text-xs font-bold text-gray-700 flex items-center gap-1.5 transition-all"
                        >
                            <FaMapMarkerAlt /> <span className="hidden md:inline">{showMap ? 'Hide Map' : 'View Map'}</span>
                        </button>

                        {/* View Property Page Btn */}
                        <Link
                            to={`/property/${property?.id}`}
                            target="_blank"
                            className="px-3 py-1.5 bg-black text-white hover:bg-gray-800 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
                        >
                            <span>🏠</span> <span className="hidden md:inline">View Details</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 relative w-full size-full max-w-7xl mx-auto p-2 md:p-4 overflow-hidden flex flex-col md:flex-row gap-4">

                {/* CALENDAR (Flexible) */}
                <div className={`flex-1 min-h-0 bg-white rounded-xl shadow-sm border border-gray-100 p-2 md:p-4 animate-fade-in ${showMap ? 'hidden md:block' : 'block'}`}>
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%' }}
                        selectable
                        onSelectSlot={handleSelectSlot}
                        onSelectEvent={handleSelectEvent}
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

                {/* MAP (Conditional or Side-by-Side on large screens if toggled) */}
                {showMap && (
                    <div className={`md:w-1/3 w-full h-full bg-gray-100 rounded-xl overflow-hidden shadow-inner border border-gray-200 animate-slide-in-right ${showMap ? 'block' : 'hidden md:block'}`}>
                        <iframe
                            width="100%"
                            height="100%"
                            frameBorder="0"
                            style={{ border: 0, minHeight: '300px' }}
                            src={getMapEmbedUrl(property?.google_map_link, property?.location)}
                            allowFullScreen
                        ></iframe>
                    </div>
                )}
            </div>

            {/* COMPACT LEGEND */}
            <div className="flex-none pb-2 flex gap-4 text-[10px] md:text-xs justify-center flex-wrap bg-white z-10">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-red-50 border border-red-100 rounded flex items-center justify-center overflow-hidden"><img src="/logo_booked.png" className="w-full h-full object-contain opacity-50" /></div> Unavailable</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-yellow-500 rounded"></span> Request Pending</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-white border border-gray-300 rounded"></div> Available</div>
            </div>

            {/* Booking Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full animate-fade-up shadow-2xl scale-100">
                        <h2 className="text-xl md:text-2xl font-bold mb-1">Request Booking</h2>
                        <p className="mb-6 text-gray-500 text-sm font-medium">
                            {format(selectedSlot.start, 'EEE, MMM dd')} - {format(selectedSlot.end, 'EEE, MMM dd, yyyy')}
                        </p>

                        <form onSubmit={handleSubmitRequest} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Your Name</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-semibold focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Enter your full name"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mobile Number</label>
                                <input
                                    type="tel"
                                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-semibold focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                                    value={mobile}
                                    onChange={e => setMobile(e.target.value)}
                                    placeholder="+91 9999999999"
                                    required
                                />
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg hover:shadow-xl translate-y-0 hover:-translate-y-0.5 active:translate-y-0"
                                >
                                    Send Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}



            {/* SUCCESS MODAL */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full text-center shadow-2xl scale-100 flex flex-col items-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600 text-3xl shadow-sm">
                            <FaCheck />
                        </div>
                        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Request Sent! 🎉</h2>
                        <p className="text-gray-500 text-sm mb-6">
                            Your booking request for <strong>{requestDetails?.property}</strong> has been sent to the <strong>Admin</strong>.
                        </p>

                        <button
                            onClick={() => {
                                const msg = `Hi Admin, I just requested a booking for *${requestDetails?.property}* from *${requestDetails?.startDate}* to *${requestDetails?.endDate}*. My name is ${requestDetails?.name}. Can you please confirm?`;
                                window.open(`https://wa.me/919870646548?text=${encodeURIComponent(msg)}`, '_blank');
                            }}
                            className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20be5c] text-white py-3.5 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all mb-3"
                        >
                            <FaWhatsapp size={24} /> Chat with Admin
                        </button>

                        <button
                            onClick={() => setShowSuccessModal(false)}
                            className="text-gray-400 font-bold text-sm hover:text-gray-600 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* POWERED BY BADGE */}
            <a
                href="/"
                target="_blank"
                className="fixed bottom-3 right-3 bg-white/90 backdrop-blur-md border border-gray-200 shadow-xl px-3 py-1.5 rounded-full flex items-center gap-2 z-40 hover:scale-105 transition-transform group"
            >
                <div className="w-8 h-8 bg-white border border-gray-100 rounded-full flex items-center justify-center p-1 overflow-hidden">
                    <img src="/logo_booked.png" alt="RW" className="w-full h-full object-contain" />
                </div>
                <div className="text-left">
                    <div className="text-[8px] text-gray-500 uppercase tracking-wider font-bold">Powered By</div>
                    <div className="text-[10px] font-bold text-gray-900 group-hover:text-primary transition-colors">ResortWala</div>
                </div>
            </a>

            <style>{`
                .past-date .rbc-button-link {
                     color: #ccc !important;
                     pointer-events: none;
                 }
                .rbc-month-view { border: none; }
                .rbc-header { padding: 8px 0; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #9ca3af; border-bottom: none; }
                .rbc-day-bg { border-left: 1px solid #f3f4f6; }
                .rbc-off-range-bg { bg-gray-50; }
                .animate-fade-in { animation: fadeIn 0.5s ease-out; }
                .animate-slide-in-right { animation: slideInRight 0.3s ease-out; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideInRight { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            `}</style>
        </div>
    );
}
