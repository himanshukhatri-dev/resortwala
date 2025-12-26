import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { FaArrowLeft, FaArrowRight, FaFilter, FaShareAlt, FaSearch, FaTimes, FaCheck, FaBan, FaLock } from 'react-icons/fa';
import { useModal } from '../context/ModalContext';

const locales = { 'en-US': enUS };

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

// Fallback Copy Function
const copyToClipboard = (text, onSuccess, onError) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(onSuccess).catch(() => {
            fallbackCopy(text, onSuccess, onError);
        });
    } else {
        fallbackCopy(text, onSuccess, onError);
    }
};

const fallbackCopy = (text, onSuccess, onError) => {
    try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";  // Avoid scrolling to bottom
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (successful) onSuccess(); else onError();
    } catch (err) {
        onError();
    }
};

// --- Custom Components for Rich View ---

// Custom Agenda Event (The Row in the List)
const CustomAgendaEvent = ({ event }) => {
    const { resource } = event;
    const statusColor = resource.Status === 'confirmed' ? 'text-green-700 bg-green-50 border-green-200' :
        resource.Status === 'pending' ? 'text-amber-700 bg-amber-50 border-amber-200' :
            'text-red-700 bg-red-50 border-red-200';

    return (
        <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 rounded-lg border ${statusColor} hover:shadow-md transition-all cursor-pointer w-full`}>
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900">{resource.CustomerName}</span>
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${statusColor}`}>
                        {resource.Status}
                    </span>
                </div>
                <div className="text-xs text-gray-600 flex flex-wrap gap-x-3">
                    <span className="font-medium text-gray-800">{event.propertyName}</span>
                    <span>📞 {resource.CustomerMobile}</span>
                    <span>👥 {resource.Guests} Guests</span>
                </div>
            </div>
            <div className="mt-2 sm:mt-0 flex flex-col items-end">
                <span className="text-sm font-bold text-gray-900">₹{resource.TotalAmount}</span>
                <span className="text-[10px] text-gray-500">
                    {format(event.start, 'MMM dd')} - {format(event.end, 'MMM dd')}
                </span>
            </div>
        </div>
    );
};

export default function GlobalCalendar() {
    const { token, user } = useAuth();
    const { showConfirm, showSuccess, showError, showInfo } = useModal();
    const navigate = useNavigate();
    const location = useLocation();

    // Responsive State
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const [showSidebar, setShowSidebar] = useState(false);

    // Data State
    const [allBookings, setAllBookings] = useState([]);
    const [properties, setProperties] = useState([]);
    const [selectedPropertyId, setSelectedPropertyId] = useState('all');
    const [loading, setLoading] = useState(true);

    // UI State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [view, setView] = useState(window.innerWidth < 1024 ? 'agenda' : 'month'); // Default view based on device
    const [showShareModal, setShowShareModal] = useState(false);

    // Handle Window Resize
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (!mobile) setShowSidebar(false); // Reset sidebar on desktop
            // Optional: Auto-switch view if needed, but user might have chosen one.
            // if (mobile && view === 'month') setView('agenda'); 
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [view]);

    // Deep Link Logic
    useEffect(() => {
        if (location.state?.bookingId && allBookings.length > 0) {
            const booking = allBookings.find(b => b.BookingId == location.state.bookingId);
            if (booking) {
                setCurrentDate(new Date(booking.CheckInDate));
                setSelectedEvent({ resource: booking, start: new Date(booking.CheckInDate), end: new Date(booking.CheckOutDate) });
            }
        }
    }, [location.state, allBookings]);

    useEffect(() => {
        if (token) {
            fetchData();
            const interval = setInterval(() => fetchData(true), 5000);
            return () => clearInterval(interval);
        }
    }, [token]);

    const fetchData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const [propsRes, bookingsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/vendor/properties`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_BASE_URL}/vendor/bookings`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setProperties(propsRes.data);
            setAllBookings(bookingsRes.data);
        } catch (error) {
            console.error("Failed to load calendar data", error);
            if (!silent) showError("Calendar Error", "Failed to refresh data");
        } finally {
            if (!silent) setLoading(false);
        }
    };

    // Filter Logic
    const filteredEvents = useMemo(() => {
        let filtered = allBookings;

        if (selectedPropertyId !== 'all') {
            filtered = filtered.filter(b => b.property?.id == selectedPropertyId || b.property?.PropertyId == selectedPropertyId);
        }

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(b =>
                b.CustomerName?.toLowerCase().includes(lowerTerm) ||
                b.CustomerMobile?.includes(searchTerm) ||
                b.BookingId?.toString().includes(searchTerm)
            );
        }

        return filtered.map(b => {
            if (!b.CheckInDate || !b.CheckOutDate) return null;
            const start = new Date(b.CheckInDate);
            const end = new Date(b.CheckOutDate);
            const propertyName = b.property?.Name || b.property?.ShortName || 'Unknown';

            return {
                id: b.BookingId,
                title: `${b.CustomerName}`,
                start, end,
                status: b.Status,
                allDay: true,
                resource: b,
                propertyName
            };
        }).filter(Boolean);
    }, [allBookings, selectedPropertyId, searchTerm]);

    const pendingRequests = useMemo(() => {
        let list = allBookings.filter(b => b.Status?.toLowerCase() === 'pending');
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            list = list.filter(b =>
                b.CustomerName?.toLowerCase().includes(lowerTerm) ||
                b.CustomerMobile?.includes(searchTerm) ||
                b.BookingId?.toString().includes(searchTerm)
            );
        }
        return list;
    }, [allBookings, searchTerm]);

    // Handlers
    const handleSelectSlot = async ({ start, end }) => {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        if (start < today) return showError('Invalid', 'Cannot lock past dates.');
        if (selectedPropertyId === 'all') return showError('Select Property', 'Pick a property to lock dates.');

        const confirmed = await showConfirm('Freeze Dates', `Freeze ${format(start, 'MMM dd')} - ${format(end, 'MMM dd')}?`, 'Freeze');
        if (!confirmed) return;

        try {
            await axios.post(`${API_BASE_URL}/vendor/bookings/lock`, {
                property_id: selectedPropertyId,
                start_date: format(start, 'yyyy-MM-dd'),
                end_date: format(end, 'yyyy-MM-dd')
            }, { headers: { Authorization: `Bearer ${token}` } });
            showSuccess('Frozen', "Dates blocked.");
            fetchData();
        } catch (e) { showError('Error', "Failed to freeze dates."); }
    };

    const handleEventAction = async (action, bookingId) => {
        try {
            if (action === 'approve') {
                await axios.post(`${API_BASE_URL}/vendor/bookings/${bookingId}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } });
                showSuccess('Approved', 'Booking confirmed.');
            } else if (action === 'reject') {
                await axios.post(`${API_BASE_URL}/vendor/bookings/${bookingId}/reject`, {}, { headers: { Authorization: `Bearer ${token}` } });
                showSuccess('Rejected', 'Booking rejected.');
            }
            fetchData();
            setSelectedEvent(null);
        } catch (e) { showError('Error', `Failed to ${action} booking.`); }
    };

    const handleShareClick = () => {
        if (selectedPropertyId !== 'all') {
            shareProperty(selectedPropertyId);
        } else {
            setShowShareModal(true);
        }
    };

    const shareProperty = (propId) => {
        const prop = properties.find(p => (p.id || p.PropertyId) == propId);
        if (!prop) return;
        const token = prop.share_token || prop.id || prop.PropertyId;
        const customerBase = import.meta.env.VITE_CUSTOMER_APP_URL || window.location.origin.replace('vendor', 'customer');
        const finalBase = customerBase.includes('localhost') ? 'http://localhost:5173' : 'http://72.61.242.42';
        const url = `${finalBase}/stay/${token}`;

        copyToClipboard(
            url,
            () => { showSuccess('Copied', `Link for ${prop.Name} copied!`); setShowShareModal(false); },
            () => { prompt("Copy Link:", url); setShowShareModal(false); }
        );
    };

    // Styles
    const eventStyleGetter = (event) => {
        let bg = '#3b82f6';
        let border = '#1d4ed8';
        const st = (event.status || '').toLowerCase();

        if (st === 'pending') { bg = '#f59e0b'; border = '#b45309'; }
        else if (st === 'confirmed') { bg = '#10b981'; border = '#047857'; }
        else if (st === 'locked' || st === 'blocked') { bg = '#ef4444'; border = '#b91c1c'; }

        return {
            style: { backgroundColor: bg, borderColor: border, borderLeftWidth: '4px', fontSize: '11px', fontWeight: '600' }
        };
    };

    // Custom Toolbar with Mobile Toggle
    const CustomToolbar = (toolbar) => {
        return (
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 px-2 gap-3 sm:gap-0">
                <div className="flex items-center w-full sm:w-auto justify-between sm:justify-start">
                    {/* Mobile Sidebar Toggle */}
                    {isMobile && (
                        <button
                            onClick={() => setShowSidebar(true)}
                            className="mr-3 p-2 bg-white border border-gray-200 rounded-lg text-gray-600 shadow-sm relative"
                        >
                            <FaFilter />
                            {pendingRequests.length > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                            )}
                        </button>
                    )}

                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button onClick={() => toolbar.onNavigate('PREV')} className="p-1 hover:bg-white rounded shadow-sm"><FaArrowLeft /></button>
                        <span className="px-4 font-bold text-gray-700 min-w-[120px] text-center">{format(toolbar.date, 'MMM yyyy')}</span>
                        <button onClick={() => toolbar.onNavigate('NEXT')} className="p-1 hover:bg-white rounded shadow-sm"><FaArrowRight /></button>
                    </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto justify-end">
                    <button onClick={() => toolbar.onView('month')} className={`px-3 py-1 text-xs font-bold rounded flex-1 sm:flex-none ${view === 'month' ? 'bg-black text-white' : 'bg-gray-100'}`}>Month</button>
                    <button onClick={() => toolbar.onView('agenda')} className={`px-3 py-1 text-xs font-bold rounded flex-1 sm:flex-none ${view === 'agenda' ? 'bg-black text-white' : 'bg-gray-100'}`}>List</button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden pt-20">

            {/* Sidebar / Action Center (Responsive) */}
            {/* Desktop: Static Sidebar */}
            {/* Mobile: Slide-over Overlay */}
            <div className={`
                fixed inset-y-0 left-0 bg-white border-r border-gray-200 flex flex-col shadow-xl z-30 transition-transform duration-300 transform
                lg:relative lg:translate-x-0 lg:w-80 lg:shadow-none
                ${showSidebar ? 'translate-x-0 w-80' : '-translate-x-full w-80 lg:translate-x-0'}
            `}>
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <div>
                        <h2 className="font-extrabold text-lg text-gray-800 mb-1">Action Center</h2>
                        <p className="text-xs text-gray-500">Manage requests & search</p>
                    </div>
                    {isMobile && (
                        <button onClick={() => setShowSidebar(false)} className="p-2 text-gray-400 hover:text-black">
                            <FaTimes />
                        </button>
                    )}
                </div>

                {/* Search */}
                <div className="p-4 border-b border-gray-100">
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-3 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Find Guest Name / Mobile..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-black outline-none"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Pending Requests List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Pending Requests ({pendingRequests.length})</h3>
                    {pendingRequests.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 text-sm">
                            {searchTerm ? 'No matches found' : 'No pending requests'}
                        </div>
                    ) : (
                        pendingRequests.map(req => (
                            <div key={req.BookingId} onClick={() => { setSelectedEvent({ resource: req }); if (isMobile) setShowSidebar(false); }} className="bg-amber-50 border border-amber-100 p-3 rounded-xl cursor-pointer hover:shadow-md transition-all">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-amber-900 text-sm">{req.CustomerName}</span>
                                    <span className="text-xs font-mono text-amber-600 bg-amber-100 px-1.5 rounded">₹{req.TotalAmount}</span>
                                </div>
                                <div className="text-xs text-amber-700 mb-2">
                                    {format(new Date(req.CheckInDate), 'MMM dd')} - {format(new Date(req.CheckOutDate), 'MMM dd')}
                                </div>
                                <div className="text-[10px] text-gray-500 truncate">{req.property?.Name}</div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Backdrop for Mobile Sidebar */}
            {isMobile && showSidebar && (
                <div className="fixed inset-0 bg-black/50 z-20" onClick={() => setShowSidebar(false)}></div>
            )}

            {/* Main Calendar Area */}
            <div className="flex-1 flex flex-col relative min-w-0">
                {/* Header Controls */}
                <div className="bg-white border-b border-gray-200 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center shadow-sm z-10 gap-3 sm:gap-0">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100 w-full sm:w-auto">
                            <FaFilter className="text-gray-400" />
                            <select
                                value={selectedPropertyId}
                                onChange={e => setSelectedPropertyId(e.target.value)}
                                className="bg-transparent font-bold text-gray-700 text-sm outline-none cursor-pointer w-full sm:w-48"
                            >
                                <option value="all">Check All Properties</option>
                                {properties.map(p => <option key={p.id || p.PropertyId} value={p.id || p.PropertyId}>{p.Name}</option>)}
                            </select>
                        </div>
                    </div>
                    <button
                        onClick={handleShareClick}
                        className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 flex items-center justify-center gap-2 w-full sm:w-auto"
                    >
                        <FaShareAlt /> Share Link
                    </button>
                </div>

                {/* Calendar Grid */}
                <div className="flex-1 p-2 sm:p-6 overflow-hidden bg-white/50 relative">
                    <Calendar
                        localizer={localizer}
                        events={filteredEvents}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%' }}
                        eventPropGetter={eventStyleGetter}
                        onSelectEvent={setSelectedEvent}
                        onSelectSlot={handleSelectSlot}
                        selectable
                        view={view}
                        onView={setView}
                        date={currentDate}
                        onNavigate={setCurrentDate}
                        drilldownView="agenda"
                        onDrillDown={(date) => {
                            setCurrentDate(date);
                            setView('agenda');
                        }}
                        popup={false}
                        components={{
                            toolbar: CustomToolbar,
                            agenda: {
                                event: CustomAgendaEvent
                            }
                        }}
                        length={30}
                    />
                </div>
            </div>

            {/* Slide-over Detail Panel (With Overlay) */}
            {selectedEvent && (
                <>
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/20 z-40 backdrop-blur-sm"
                        onClick={() => setSelectedEvent(null)}
                    ></div>

                    {/* Panel */}
                    <div className="absolute inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 border-l border-gray-200 flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50">
                            <div>
                                <h2 className="text-xl font-extrabold text-gray-900">{selectedEvent.resource.CustomerName}</h2>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase mt-1 inline-block ${selectedEvent.resource.Status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                    selectedEvent.resource.Status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                    {selectedEvent.resource.Status}
                                </span>
                            </div>
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="p-2 bg-white border border-gray-200 text-gray-500 hover:text-black hover:bg-gray-100 rounded-full shadow-sm transition-all"
                            >
                                <FaTimes size={16} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase">Property</label>
                                    <p className="font-semibold text-gray-800">{selectedEvent.resource.property?.Name || selectedEvent.propertyName}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase">Check In</label>
                                        <p className="font-semibold text-gray-800">{format(new Date(selectedEvent.resource.CheckInDate), 'EEE, MMM dd')}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase">Check Out</label>
                                        <p className="font-semibold text-gray-800">{format(new Date(selectedEvent.resource.CheckOutDate), 'EEE, MMM dd')}</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase">Stats</label>
                                    <div className="flex gap-4 mt-1">
                                        <span className="bg-gray-100 px-3 py-1 rounded-lg text-sm font-bold text-gray-700">👥 {selectedEvent.resource.Guests} Guests</span>
                                        <span className="bg-gray-100 px-3 py-1 rounded-lg text-sm font-bold text-gray-700">💰 ₹{selectedEvent.resource.TotalAmount}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase">Contact</label>
                                    <p className="font-medium text-blue-600 underline cursor-pointer" onClick={() => window.open(`tel:${selectedEvent.resource.CustomerMobile}`)}>{selectedEvent.resource.CustomerMobile}</p>
                                    <p className="text-sm text-gray-500">{selectedEvent.resource.CustomerEmail}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 border-t border-gray-100 space-y-3">
                            {selectedEvent.resource.Status?.toLowerCase() === 'pending' && (
                                <>
                                    <button onClick={() => handleEventAction('approve', selectedEvent.resource.BookingId)} className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 flex justify-center gap-2">
                                        <FaCheck /> Approve Request
                                    </button>
                                    <button onClick={() => handleEventAction('reject', selectedEvent.resource.BookingId)} className="w-full bg-white text-red-600 border border-red-200 font-bold py-3 rounded-xl hover:bg-red-50 flex justify-center gap-2">
                                        <FaBan /> Reject
                                    </button>
                                </>
                            )}
                            {selectedEvent.resource.Status?.toLowerCase() === 'confirmed' && (
                                <button className="w-full bg-gray-200 text-gray-500 font-bold py-3 rounded-xl cursor-not-allowed flex justify-center gap-2">
                                    <FaLock /> Booking Confirmed
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Share Modal */}
            {showShareModal && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowShareModal(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-6 bg-gray-900 text-white flex justify-between items-center">
                            <h3 className="text-xl font-bold">Share Property</h3>
                            <button onClick={() => setShowShareModal(false)} className="text-gray-400 hover:text-white"><FaTimes /></button>
                        </div>
                        <div className="p-6 space-y-2 max-h-[60vh] overflow-y-auto">
                            <p className="text-sm text-gray-500 mb-4">Select a property to copy its public link:</p>
                            {properties.map(p => (
                                <button
                                    key={p.id || p.PropertyId}
                                    onClick={() => shareProperty(p.id || p.PropertyId)}
                                    className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-black hover:bg-gray-50 transition-all group"
                                >
                                    <span className="font-bold text-gray-700 group-hover:text-black">{p.Name}</span>
                                    <FaShareAlt className="text-gray-300 group-hover:text-black" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
