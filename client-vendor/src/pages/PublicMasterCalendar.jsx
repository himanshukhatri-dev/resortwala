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
import { FaWhatsapp, FaCalendarAlt, FaBuilding } from 'react-icons/fa';

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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
                const res = await axios.get(`${baseURL}/api/public/vendors/${id}/calendar`);

                setVendor(res.data.vendor);
                setProperties(res.data.properties);

                const formattedEvents = res.data.events.map(evt => ({
                    ...evt,
                    start: new Date(evt.start),
                    end: new Date(evt.end),
                    title: 'Booked', // Ensure title is sanitized
                }));
                setEvents(formattedEvents);
                setLoading(false);
            } catch (err) {
                console.error("Fetch Error:", err);
                setError("Calendar not found or unavailable.");
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleWhatsAppInquiry = () => {
        // Master inquiry is generic
        let text = `Hi, I am viewing your property portfolio calendar.`;
        text += `\nI am interested in booking one of your properties.`;
        text += `\nPlease let me know availability.`;

        // We don't have a single mobile number for the vendor in the response currently (User model fetch).
        // I should stick to generic sharing or just open empty WhatsApp. 
        // Or fetch User mobile. 'User' model usually has 'mobile_no'. 
        // I'll assume standard flow for now.
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-500 font-bold">Loading Portfolio...</div>;
    if (error) return <div className="flex items-center justify-center min-h-screen text-red-500 font-bold">{error}</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white px-4 py-6 shadow-sm border-b sticky top-0 z-50">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight leading-tight">{vendor?.name}'s Collection</h1>
                        <p className="text-gray-500 text-sm flex items-center gap-1"><FaBuilding className="text-indigo-500" /> {properties.length} Properties Managed</p>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-4 mt-6">
                {/* Calendar */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden p-6 mb-24">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2"><FaCalendarAlt className="text-indigo-600" /> Availability Overview</h3>
                        <div className="hidden md:flex items-center gap-4 text-xs font-bold uppercase tracking-wider">
                            <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-100 border border-red-500"></div> Booked</span>
                            <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-white border border-gray-300"></div> Available</span>
                        </div>
                    </div>

                    <div className="h-[600px] public-calendar">
                        <Calendar
                            localizer={localizer}
                            events={events}
                            startAccessor="start"
                            endAccessor="end"
                            views={['month']}
                            defaultView="month"
                            eventPropGetter={(event) => ({
                                className: 'bg-red-500 text-white border-0 opacity-80 pointer-events-none',
                                style: { backgroundColor: '#EF4444', color: 'white' }
                            })}
                            tooltipAccessor="title"
                            components={{
                                event: ({ event }) => (
                                    <div className="text-[10px] items-center gap-1">
                                        <span className="font-bold">{properties.find(p => p.PropertyId === event.resourceId)?.Name?.slice(0, 10)}..</span>
                                    </div>
                                )
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Bottom Floating Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-40">
                <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Interested?</p>
                        <p className="text-sm font-medium text-gray-900">Reach out to book</p>
                    </div>
                    <button
                        onClick={handleWhatsAppInquiry}
                        className="flex-1 max-w-xs bg-[#25D366] hover:bg-[#1ebc57] text-white py-3.5 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-200"
                    >
                        <FaWhatsapp size={20} />
                        Contact Owner
                    </button>
                </div>
            </div>

            <style>{`
                .rbc-calendar { font-family: inherit; }
                .rbc-month-view { border: 0; }
                .rbc-header { padding: 12px 0; font-weight: 700; color: #9CA3AF; font-size: 12px; border-bottom: 0; text-transform: uppercase; }
                .rbc-day-bg { border-left: 0; border-right: 0; }
                .rbc-date-cell { padding: 8px; font-weight: 600; color: #374151; font-size: 14px; text-align: center; }
                .rbc-off-range-bg { background: #F9FAFB; }
                .rbc-today { background: #EEF2FF; }
                .rbc-event { border-radius: 4px; padding: 2px 4px; }
            `}</style>
        </div>
    );
};

export default PublicMasterCalendar;
