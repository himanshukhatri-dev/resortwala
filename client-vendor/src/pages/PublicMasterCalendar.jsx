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
import { FaWhatsapp, FaCalendarAlt, FaBuilding, FaArrowLeft, FaArrowRight, FaShareAlt, FaCheckCircle, FaTimesCircle, FaLock, FaFilter } from 'react-icons/fa';
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

    // Filter State
    const [selectedPropertyId, setSelectedPropertyId] = useState('all');

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/public/vendors/${id}/calendar`);
            setVendor(res.data.vendor);
            setProperties(res.data.properties);

            if (res.data.properties.length > 0) {
                setBookingForm(prev => ({ ...prev, propertyId: res.data.properties[0].PropertyId }));
            }

            const rawEvents = (res.data.events || []).map(evt => ({
                ...evt,
                start: new Date(evt.start),
                end: new Date(evt.end),
                title: 'Booked',
                resourceId: evt.resourceId
            }));
            setEvents(rawEvents);
            setLoading(false);
        } catch (err) {
            console.error("Fetch Error:", err);
            setError("Calendar not found or unavailable.");
            setLoading(false);
        }
    };

    // Helper: Generate Color from ID
    const getColorForProperty = (propId) => {
        const colors = [
            '#3B82F6', // Blue
            '#10B981', // Emerald
            '#F59E0B', // Amber
            '#EF4444', // Red
            '#8B5CF6', // Violet
            '#EC4899', // Pink
            '#06B6D4', // Cyan
            '#84CC16', // Lime
            '#6366F1', // Indigo
            '#D946EF'  // Fuchsia
        ];
        // Simple hash to pick a consistent color
        const index = String(propId).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
        return colors[index];
    };

    // Helper: Get Customer App URL
    const getCustomerUrl = (shareToken, propId) => {
        const hostname = window.location.hostname;
        let baseUrl = 'http://localhost:3002'; // Default Local

        if (hostname !== 'localhost') {
            // Dynamic Hostname Logic:
            // Remove 'vendor' from the hostname to get the customer app hostname.
            // e.g. stagingvendor.resortwala.com -> staging.resortwala.com
            // e.g. vendor.resortwala.com -> resortwala.com
            let customerHostname = hostname.replace('vendor', '');

            // Clean up potentially formed double dots or leading dots
            if (customerHostname.startsWith('.')) {
                customerHostname = customerHostname.substring(1);
            }
            customerHostname = customerHostname.replace('..', '.');

            baseUrl = `https://${customerHostname}`;
        }

        // Prioritize Share Token if available
        if (shareToken) return `${baseUrl}/stay/${shareToken}`;
        return `${baseUrl}/property/${propId}`;
    };

    const filteredEvents = React.useMemo(() => {
        if (selectedPropertyId === 'all') return events;
        return events.filter(evt => String(evt.resourceId) === String(selectedPropertyId));
    }, [events, selectedPropertyId]);

    const handleSelectSlot = ({ start, end }) => {
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
                fetchData();
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
            const textArea = document.createElement("textarea");
            textArea.value = window.location.href;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert("Link copied to clipboard!");
        }
    };

    const CustomToolbar = (toolbar) => {
        const goToBack = () => { toolbar.onNavigate('PREV'); };
        const goToNext = () => { toolbar.onNavigate('NEXT'); };

        return (
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 px-2">
                <div className="flex items-center gap-4 bg-white p-1 rounded-full shadow-sm border border-gray-100">
                    <button onClick={goToBack} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition">
                        <FaArrowLeft />
                    </button>
                    <span className="text-lg font-bold text-gray-800 capitalize min-w-[140px] text-center">
                        {format(toolbar.date, 'MMMM yyyy')}
                    </span>
                    <button onClick={goToNext} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition">
                        <FaArrowRight />
                    </button>
                </div>

                {/* Property Filter & Legend */}
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                        <select
                            value={selectedPropertyId}
                            onChange={(e) => setSelectedPropertyId(e.target.value)}
                            className="pl-8 pr-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm outline-none text-sm font-bold text-gray-700 min-w-[180px] cursor-pointer appearance-none hover:border-gray-300 transition-colors"
                        >
                            <option value="all">All Properties</option>
                            {properties.map(p => (
                                <option key={p.PropertyId} value={p.PropertyId}>{p.Name}</option>
                            ))}
                        </select>
                    </div>

                    {/* View Property Button (Only if one selected) */}
                    {selectedPropertyId !== 'all' && (
                        <a
                            href={getCustomerUrl(properties.find(p => String(p.PropertyId) === selectedPropertyId)?.share_token, selectedPropertyId)}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-black text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-gray-800 transition-colors flex items-center gap-2"
                        >
                            View Property ↗
                        </a>
                    )}
                </div>
            </div>
        );
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-500 font-bold animate-pulse">Loading Portfolio...</div>;
    if (error) return <div className="flex items-center justify-center min-h-screen text-red-500 font-bold">{error}</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">
            {/* BRANDED HEADER */}
            <div className="bg-white px-6 py-4 shadow-sm border-b sticky top-0 z-40">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {/* ResortWala Branding */}
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-black text-gray-900 tracking-tighter leading-none">
                                Resort<span className="text-indigo-600">Wala</span>
                            </h1>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Verified Collection</span>
                        </div>

                        <div className="h-8 w-px bg-gray-200 hidden md:block"></div>

                        {/* Vendor Name */}
                        <div>
                            <h2 className="text-lg font-bold text-gray-800 leading-tight hidden md:block">{vendor?.name}</h2>
                            <p className="text-gray-500 text-xs hidden md:flex items-center gap-1">
                                <FaBuilding className="text-gray-400" size={10} /> {properties.length} Properties
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <h2 className="text-sm font-bold text-gray-700 md:hidden">{vendor?.name}</h2>
                        <button onClick={handleShare} className="p-2.5 bg-gray-100 rounded-full text-gray-700 hover:bg-gray-200 transition-colors" title="Share Portfolio">
                            <FaShareAlt />
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-4 sm:p-6">

                {/* PROPERTY LEGEND (Mobile/Desktop) */}
                {selectedPropertyId === 'all' && (
                    <div className="mb-4 flex flex-wrap gap-2">
                        {properties.map(p => (
                            <div key={p.PropertyId} className="bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm flex items-center gap-2 text-xs font-medium">
                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: getColorForProperty(p.PropertyId) }}></span>
                                <span className="text-gray-700 truncate max-w-[150px]">{p.Name}</span>
                                <a href={getCustomerUrl(p.share_token, p.PropertyId)} target="_blank" rel="noreferrer" className="text-indigo-500 hover:text-indigo-700 ml-1">↗</a>
                            </div>
                        ))}
                    </div>
                )}

                {/* Calendar */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden p-4 md:p-6 mb-24 border border-gray-100">
                    <div className="h-[650px] public-calendar">
                        <Calendar
                            localizer={localizer}
                            events={filteredEvents}
                            startAccessor="start"
                            endAccessor="end"
                            views={['month']}
                            defaultView="month"
                            selectable
                            onSelectSlot={handleSelectSlot}
                            eventPropGetter={(event) => {
                                const color = getColorForProperty(event.resourceId);
                                return {
                                    className: 'text-white border-0 opacity-90 pointer-events-none text-[10px] font-medium shadow-sm',
                                    style: { backgroundColor: color, padding: '1px 4px' }
                                };
                            }}
                            components={{
                                toolbar: CustomToolbar,
                                event: ({ event }) => (
                                    <div className="truncate flex items-center gap-1" title={properties.find(p => p.PropertyId === event.resourceId)?.Name}>
                                        {properties.find(p => p.PropertyId === event.resourceId)?.Name}
                                    </div>
                                )
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Footer Branding */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 p-3 z-30 text-center">
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
                        {/* Form content remains same */}
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
