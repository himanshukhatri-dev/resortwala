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
import { API_BASE_URL } from '../config';
import { FaWhatsapp, FaCalendarAlt, FaBuilding, FaArrowLeft, FaArrowRight, FaShareAlt, FaCheckCircle, FaTimesCircle, FaLock } from 'react-icons/fa';
import { useModal } from '../context/ModalContext'; // Assuming this exists or we built a local one

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

const PublicMasterCalendar = () => {
    const { id } = useParams(); // Vendor ID
    const [vendor, setVendor] = useState(null);
    const [events, setEvents] = useState([]);
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Booking Modal State
    const [showModal, setShowModal] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [bookingForm, setBookingForm] = useState({ name: '', mobile: '', propertyId: '' });
    const [submitting, setSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/public/vendors/${id}/calendar`);

            setVendor(res.data.vendor);
            setProperties(res.data.properties);

            // Default property for booking if available
            if (res.data.properties.length > 0) {
                setBookingForm(prev => ({ ...prev, propertyId: res.data.properties[0].PropertyId }));
            }

            const formattedEvents = res.data.events.map(evt => ({
                ...evt,
                start: new Date(evt.start),
                end: new Date(evt.end),
                title: 'Booked',
                resourceId: evt.resourceId
            }));
            setEvents(formattedEvents);
            setLoading(false);
        } catch (err) {
            console.error("Fetch Error:", err);
            setError("Calendar not found or unavailable.");
            setLoading(false);
        }
    };

    const handleSelectSlot = ({ start, end }) => {
        // Prevent past dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (start < today) {
            alert("Cannot select past dates.");
            return;
        }

        setSelectedSlot({ start, end });
        setSubmitSuccess(false);
        setShowModal(true);
    };

    const handleBookingSubmit = async (e) => {
        e.preventDefault();
        if (!bookingForm.name || !bookingForm.mobile || !bookingForm.propertyId) {
            alert("Please fill all fields");
            return;
        }

        setSubmitting(true);
        setSubmitting(true);
        try {
            await axios.post(`${API_BASE_URL}/public/bookings/request`, {
                property_id: bookingForm.propertyId,
                start_date: format(selectedSlot.start, 'yyyy-MM-dd'),
                end_date: format(selectedSlot.end, 'yyyy-MM-dd'),
                name: bookingForm.name,
                mobile: bookingForm.mobile
            });
            setSubmitSuccess(true);
            setTimeout(() => {
                setShowModal(false);
                setBookingForm({ name: '', mobile: '', propertyId: properties[0]?.PropertyId || '' });
                fetchData(); // Refresh calendar
            }, 2000);
        } catch (err) {
            alert(err.response?.data?.message || "Booking Failed");
        } finally {
            setSubmitting(false);
        }
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: `${vendor?.name}'s Collection`,
                text: 'Check out availability for these properties.',
                url: window.location.href,
            }).catch(console.error);
        } else {
            // Fallback
            navigator.clipboard.writeText(window.location.href);
            alert("Link copied to clipboard!");
        }
    };

    // Custom Toolbar
    const CustomToolbar = (toolbar) => {
        const goToBack = () => { toolbar.onNavigate('PREV'); };
        const goToNext = () => { toolbar.onNavigate('NEXT'); };

        return (
            <div className="flex justify-between items-center mb-6 px-2">
                <button onClick={goToBack} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition">
                    <FaArrowLeft />
                </button>
                <span className="text-xl font-bold text-gray-800 capitalize">
                    {format(toolbar.date, 'MMMM yyyy')}
                </span>
                <button onClick={goToNext} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition">
                    <FaArrowRight />
                </button>
            </div>
        );
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-500 font-bold">Loading Portfolio...</div>;
    if (error) return <div className="flex items-center justify-center min-h-screen text-red-500 font-bold">{error}</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">
            {/* Header */}
            <div className="bg-white px-4 py-4 shadow-sm border-b sticky top-0 z-40">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight leading-tight">{vendor?.name}'s Collection</h1>
                        <p className="text-gray-500 text-xs md:text-sm flex items-center gap-1"><FaBuilding className="text-indigo-500" /> {properties.length} Properties Managed</p>
                    </div>
                    <button onClick={handleShare} className="p-2 bg-gray-100 rounded-full text-indigo-600 hover:bg-indigo-50 transition">
                        <FaShareAlt />
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-4 mt-2">
                {/* Calendar */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden p-4 md:p-6 mb-24 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-800 text-base flex items-center gap-2"><FaCalendarAlt className="text-indigo-600" /> check Availability</h3>
                        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider">
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Booked</span>
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Free</span>
                        </div>
                    </div>

                    <div className="h-[550px] public-calendar">
                        <Calendar
                            localizer={localizer}
                            events={events}
                            startAccessor="start"
                            endAccessor="end"
                            views={['month']}
                            defaultView="month"
                            selectable
                            onSelectSlot={handleSelectSlot}
                            eventPropGetter={(event) => ({
                                className: 'bg-red-500 text-white border-0 opacity-90 pointer-events-none text-[10px]',
                                style: { backgroundColor: '#EF4444', color: 'white', fontSize: '10px', padding: '1px 3px' }
                            })}
                            components={{
                                toolbar: CustomToolbar,
                                event: ({ event }) => (
                                    <div className="truncate" title={properties.find(p => p.PropertyId === event.resourceId)?.Name}>
                                        {properties.find(p => p.PropertyId === event.resourceId)?.Name}
                                    </div>
                                )
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Footer Branding */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-3 z-30 text-center">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest flex items-center justify-center gap-1">
                    Powered by <span className="font-extrabold text-indigo-900 tracking-tighter text-sm">ResortWala</span>
                </p>
            </div>

            {/* Booking Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-scale-up">
                        <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
                            <h3 className="font-bold text-lg">Request Booking</h3>
                            <button onClick={() => setShowModal(false)}><FaTimesCircle size={20} className="opacity-80 hover:opacity-100" /></button>
                        </div>

                        {submitSuccess ? (
                            <div className="p-8 text-center">
                                <FaCheckCircle className="text-green-500 text-5xl mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-800">Request Sent!</h3>
                                <p className="text-gray-500 mt-2 text-sm">The owner will contact you shortly.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleBookingSubmit} className="p-6 space-y-4">
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm">
                                    <div className="flex justify-between text-gray-500 mb-1">
                                        <span>Check-in</span>
                                        <span>Check-out</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-gray-800">
                                        <span>{selectedSlot && format(selectedSlot.start, 'dd MMM yyyy')}</span>
                                        <span><FaArrowRight className="inline mx-1 text-gray-300" size={10} /></span>
                                        <span>{selectedSlot && format(selectedSlot.end, 'dd MMM yyyy')}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Property</label>
                                    <select
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                        value={bookingForm.propertyId}
                                        onChange={(e) => setBookingForm({ ...bookingForm, propertyId: e.target.value })}
                                    >
                                        {properties.map(p => (
                                            <option key={p.PropertyId} value={p.PropertyId}>{p.Name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Your Name</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                        placeholder="John Doe"
                                        value={bookingForm.name}
                                        onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mobile Number</label>
                                    <input
                                        type="tel"
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                        placeholder="9876543210"
                                        value={bookingForm.mobile}
                                        onChange={(e) => setBookingForm({ ...bookingForm, mobile: e.target.value })}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                >
                                    {submitting ? 'Sending...' : <>Request Booking <FaLock size={12} className="opacity-70" /></>}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                .rbc-calendar { font-family: inherit; }
                .rbc-month-view { border: 0; }
                .rbc-header { padding: 12px 0; font-weight: 700; color: #9CA3AF; font-size: 10px; border-bottom: 0; text-transform: uppercase; letter-spacing: 1px; }
                .rbc-day-bg { border: 1px solid #f3f4f6; margin: 2px; border-radius: 8px;}
                .rbc-date-cell { padding: 4px; font-weight: 600; color: #374151; font-size: 12px; text-align: center; }
                .rbc-off-range-bg { background: transparent; opacity: 0.3; }
                .rbc-today { background: #EEF2FF !important; border: 1px solid #818cf8 !important; }
                .rbc-event { border-radius: 4px; padding: 1px 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
                
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scale-up { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
                .animate-scale-up { animation: scale-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            `}</style>
        </div>
    );
};

export default PublicMasterCalendar;
