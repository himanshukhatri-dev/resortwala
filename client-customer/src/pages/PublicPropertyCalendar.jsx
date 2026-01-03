import axios from 'axios';
import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { normalizePhone, isValidMobile } from '../utils/validation';
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

    // Error Modal State
    const [errorModal, setErrorModal] = useState({ open: false, title: '', message: '' });

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
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const endGen = new Date();
            endGen.setMonth(endGen.getMonth() + 6);

            const holidays = data.holidays || [];
            const priceMonThu = parseFloat(data.property.price_mon_thu || 0);
            const priceFriSun = parseFloat(data.property.price_fri_sun || 0);

            // 2. Overlay Bookings (These will visually override rates if we treat them right, or share space)
            data.bookings.forEach(b => {
                const startDate = parse(b.CheckInDate, 'yyyy-MM-dd', new Date());
                const endDate = parse(b.CheckOutDate, 'yyyy-MM-dd', new Date());

                let currentDate = new Date(startDate);
                while (currentDate < endDate) {
                    const dStr = format(currentDate, 'yyyy-MM-dd');
                    const rateIndex = processedEvents.findIndex(e => e.type === 'rate' && format(e.start, 'yyyy-MM-dd') === dStr);
                    if (rateIndex !== -1) {
                        processedEvents.splice(rateIndex, 1); // Remove rate, replace with booking
                    }

                    // Determine label based on booking source
                    let label = 'ResortWala'; // Default for locked/confirmed

                    if (b.Status === 'pending') {
                        label = 'Pending';
                    } else if (b.booking_source === 'customer_app' && (b.Status === 'confirmed' || b.Status === 'locked')) {
                        // Customer App bookings -> Booked (User Request: "NA should be Booked")
                        label = 'Booked';
                    } else if (b.Status === 'confirmed' || b.Status === 'locked') {
                        // Vendor/Admin/Locked -> ResortWala (User Request: "NA should show complete ResortWala text")
                        label = 'ResortWala';
                    }

                    processedEvents.push({
                        title: label,
                        start: new Date(currentDate),
                        end: new Date(currentDate),
                        status: b.Status,
                        allDay: true,
                        type: 'booking',
                        source: b.booking_source
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
            setErrorModal({
                open: true,
                title: 'Invalid Date',
                message: 'You cannot select dates in the past. Please choose a future date.'
            });
            return;
        }

        let check = new Date(start);
        const final = new Date(end);
        let hasConflict = false;

        while (check < final) {
            const time = check.getTime();
            const conflict = events.find(e =>
                e.type === 'booking' &&
                e.start.getTime() <= time &&
                e.end.getTime() >= time
            );

            if (conflict) {
                setErrorModal({
                    open: true,
                    title: 'Dates Unavailable',
                    message: 'Some dates in your selection are already booked. Please choose a different range.'
                });
                return;
            }
            check.setDate(check.getDate() + 1);
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
            const start = new Date(event.start);
            const end = new Date(event.start);
            end.setDate(end.getDate() + 1); // Select 1 night

            setSelectedSlot({ start, end });
            setShowModal(true);
        }
    };

    const handleSubmitRequest = async (e) => {
        e.preventDefault();

        console.log("Submitting Request:", { name, mobile });

        if (!name || !mobile) {
            alert("Please fill all details");
            return;
        }

        if (!isValidMobile(mobile)) {
            alert("Please enter a valid 10-digit mobile number");
            return;
        }

        const cleanMobile = normalizePhone(mobile); // Clean up for backend

        try {
            // Call API using unique path /request-booking to avoid Nginx/Laravel routing conflicts
            const apiUrl = `${API_BASE_URL}/request-booking`;

            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };

            const response = await axios.post(apiUrl, {
                property_id: property.id,
                start_date: format(selectedSlot.start, 'yyyy-MM-dd'),
                end_date: format(selectedSlot.end, 'yyyy-MM-dd'),
                name,
                mobile: cleanMobile
            }, { headers });

            // Prepare details for Success Modal & WhatsApp
            setRequestDetails({
                name,
                mobile: cleanMobile,
                startDate: format(selectedSlot.start, 'dd MMM'),
                endDate: format(selectedSlot.end, 'dd MMM'),
                property: property?.name || 'Villa'
            });
            setShowSuccessModal(true);
            setShowModal(false);

            setName('');
            setMobile('');
            fetchCalendarData(); // Refresh immediately
        } catch (error) {
            console.error("Submission Error:", error);
            alert("Booking Failed: " + (error.response?.data?.message || "Please check your network connection."));
        }
    };

    const eventStyleGetter = (event) => {
        // If it's a rate/available slot, make it transparent (or white)
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
        const day = date.getDay();
        const isWeekend = day === 0 || day === 6; // Sunday or Saturday

        if (date < today) {
            return {
                style: {
                    backgroundColor: '#f3f4f6',
                    color: '#9ca3af',
                    pointerEvents: 'none',
                },
                className: 'past-date'
            };
        }

        if (isWeekend) {
            return {
                style: {
                    backgroundColor: '#fef2f2',
                },
                className: 'weekend-date'
            };
        }

        return {};
    };

    const CustomEvent = ({ event }) => {
        const isBooked = event.type === 'booking';

        if (isBooked) {
            // Differentiate Pending vs NA
            if (event.status === 'pending') {
                return (
                    <div className="relative w-full h-full group flex items-center justify-center">
                        <div className="w-full h-full bg-yellow-400 border border-yellow-500 rounded-md overflow-hidden relative flex items-center justify-center shadow-sm">
                            <span className="text-[10px] md:text-[11px] font-bold text-white uppercase tracking-tight drop-shadow-sm">Pending</span>
                        </div>
                    </div>
                );
            }

            // Adjust Font Size for longer "ResortWala" text
            const isLongText = event.title.length > 5;

            return (
                <div className="relative w-full h-full group flex items-center justify-center pointer-events-none">
                    <div className="w-full h-full bg-red-50 border border-red-100 rounded-md overflow-hidden relative flex items-center justify-center">
                        <span className={`${isLongText ? 'text-[8px] md:text-[9px]' : 'text-[9px] md:text-[10px]'} font-bold text-red-600 uppercase tracking-tight text-center px-0.5 leading-none`}>{event.title}</span>
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
                <div className="flex items-center gap-1.5"><div className="w-fit px-1 h-3 bg-red-50 border border-red-100 rounded flex items-center justify-center text-[7px] font-bold text-red-600">ResortWala</div> ResortWala Booking</div>
                <div className="flex items-center gap-1.5"><div className="w-fit px-1 h-3 bg-red-50 border border-red-100 rounded flex items-center justify-center text-[7px] font-bold text-red-600">Booked</div> Unavailable</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-yellow-500 rounded"></span> Request Pending</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-white border border-gray-300 rounded"></div> Available</div>
            </div>

            {/* ERROR MODAL */}
            {errorModal.open && (
                <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl scale-100 flex flex-col items-center border border-red-100">
                        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500 text-2xl shadow-sm border border-red-100">
                            <FaTimes />
                        </div>
                        <h2 className="text-xl font-extrabold text-gray-900 mb-2">{errorModal.title}</h2>
                        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                            {errorModal.message}
                        </p>
                        <button
                            onClick={() => setErrorModal({ ...errorModal, open: false })}
                            className="w-full bg-gray-900 hover:bg-black text-white py-3 rounded-xl font-bold shadow-lg transition-transform active:scale-95"
                        >
                            Okay, Got it
                        </button>
                    </div>
                </div>
            )}

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
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength="10"
                                    className="w-full p-4 pl-12 border border-gray-200 rounded-xl outline-none focus:border-black transition font-bold text-gray-800"
                                    value={mobile}
                                    onChange={e => {
                                        const re = /^[0-9\b]+$/;
                                        if (e.target.value === '' || re.test(e.target.value)) {
                                            setMobile(e.target.value);
                                        }
                                    }}
                                    placeholder="9999999999"
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
                    <div className="text-[10px] font-bold group-hover:text-primary transition-colors">
                        <span className="text-red-600">Resort</span><span className="text-blue-600">Wala</span>
                    </div>
                </div>
            </a>

            <style>{`
                .past-date .rbc-button-link {
                     color: #ccc !important;
                     pointer-events: none;
                 }
                .rbc-month-view { border: none; }
                .rbc-header { padding: 8px 0; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #9ca3af; border-bottom: none; }
                
                /* Weekend header styling - Saturday and Sunday in red */
                .rbc-header:nth-child(1) span, /* Sunday */
                .rbc-header:nth-child(7) span  /* Saturday */ {
                    color: #dc2626 !important;
                    font-weight: 700;
                }
                
                /* Weekend date numbers in red */
                .weekend-date .rbc-button-link {
                    color: #dc2626 !important;
                    font-weight: 600;
                }
                
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
