import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { API_BASE_URL } from '../config';
import { FaArrowLeft, FaArrowRight, FaFilter, FaPlus, FaMoneyBillWave, FaTrash, FaWhatsapp } from 'react-icons/fa';

const locales = { 'en-US': enUS };

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

export default function Holiday() {
    const { token } = useAuth();
    const { showConfirm, showSuccess, showError, showInfo } = useModal();
    const [properties, setProperties] = useState([]);
    const [selectedPropertyId, setSelectedPropertyId] = useState('');
    const [holidays, setHolidays] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editData, setEditData] = useState(null); // If editing specific holiday
    const [range, setRange] = useState({ start: null, end: null });
    const [form, setForm] = useState({
        name: '',
        base_price: '',
        extra_person_price: ''
    });

    useEffect(() => {
        fetchProperties();
        fetchHolidays();
    }, []);

    const fetchProperties = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/vendor/properties`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Filter out Waterparks as requested
            const validProperties = response.data.filter(p => {
                const type = p.PropertyType || '';
                return !type.toLowerCase().includes('waterpark');
            });
            setProperties(validProperties);
            // requested: do not auto-select first property
            // if (validProperties.length > 0) {
            //     setSelectedPropertyId(validProperties[0].id || validProperties[0].PropertyId);
            // }
        } catch (error) {
            console.error('Error fetching properties:', error);
        }
    };

    const fetchHolidays = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/holidays`);
            setHolidays(response.data);
        } catch (error) {
            console.error('Error fetching holidays:', error);
        } finally {
            setLoading(false);
        }
    };

    // Helper: Calculate standard price for a date
    const getPriceForDate = (date, property) => {
        if (!property) return 0;
        const priceMonThu = parseFloat(property.pricing?.weekday || property.price_mon_thu || 0);
        const priceFriSun = parseFloat(property.pricing?.weekend || property.price_fri_sun || property.price || 0);
        const priceSat = parseFloat(property.pricing?.saturday || property.price_sat || priceFriSun);

        const dayOfWeek = date.getDay();
        if (dayOfWeek === 6) return priceSat;
        if (dayOfWeek === 0 || dayOfWeek === 5) return priceFriSun;
        return priceMonThu;
    };

    const [bookings, setBookings] = useState([]); // Add bookings state

    useEffect(() => {
        if (selectedPropertyId) {
            fetchBookings();
        }
    }, [selectedPropertyId, token]); // Fetch bookings when property changes

    const fetchBookings = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/vendor/bookings/property/${selectedPropertyId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Filter distinct booked dates (Locked/Confirmed)
            console.log("Raw Bookings:", response.data);
            // Filter distinct booked dates (Locked/Confirmed/Pending) - Case Insensitive
            const booked = response.data.filter(b => {
                const status = (b.Status || '').toLowerCase();
                return status === 'confirmed' || status === 'locked' || status === 'pending';
            });
            console.log("Filtered Booked:", booked);
            setBookings(booked);
        } catch (error) {
            console.error('Error fetching bookings:', error);
        }
    };

    // Helper to check if a date is booked
    const isDateBooked = (date) => {
        const dStr = format(date, 'yyyy-MM-dd');
        return bookings.some(b => {
            const start = b.CheckInDate.substring(0, 10);
            const end = b.CheckOutDate.substring(0, 10);
            return dStr >= start && dStr < end; // Exclude checkout day? Typically yes for availability, but for holidays maybe strictly overlap?
            // User requirement: "if already booked or locked should not be editable"
            // If someone is staying that night, we shouldn't change the rate (it's locked).
        });
    };

    // GENERATE CALENDAR EVENTS (RATES)
    useEffect(() => {
        if (!selectedPropertyId || properties.length === 0) return;

        const property = properties.find(p => (p.id || p.PropertyId) == selectedPropertyId);
        if (!property) return;

        // Base Rates
        const priceMonThu = parseFloat(property.pricing?.weekday || property.price_mon_thu || 0);
        const priceFriSun = parseFloat(property.pricing?.weekend || property.price_fri_sun || property.price || 0);
        const priceSat = parseFloat(property.pricing?.saturday || property.price_sat || priceFriSun);

        const generatedEvents = [];

        // 1. Generate Daily Rates for current view window (e.g., -1 month to +6 months)
        const startGen = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        const endGen = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let d = new Date(startGen); d <= endGen; d.setDate(d.getDate() + 1)) {
            // Skip past dates
            if (d < today) continue;

            const dateStr = format(d, 'yyyy-MM-dd');
            const dayOfWeek = d.getDay(); // 0=Sun, 6=Sat

            // Check for Holiday Override
            // Check for Holiday Override
            const holiday = holidays.find(h => {
                const holidayPropId = h.property_id || h.property?.id || h.property?.PropertyId;
                if (holidayPropId && String(holidayPropId) !== String(selectedPropertyId)) return false;

                const start = new Date(h.from_date);
                const end = new Date(h.to_date);
                start.setHours(0, 0, 0, 0);
                end.setHours(0, 0, 0, 0);
                const current = new Date(d);
                current.setHours(0, 0, 0, 0);
                return current >= start && current <= end;
            });

            let price = getPriceForDate(d, property);
            let type = 'standard';
            let title = '';
            let id = `rate-${dateStr}`;
            let resource = null;
            let status = 'approved';

            if (holiday) {
                price = parseFloat(holiday.base_price || 0);
                type = 'holiday';
                title = holiday.name || 'Holiday';
                id = `holiday-${holiday.id}-${dateStr}`;
                resource = holiday;
                // Check if pending status
                if (holiday.approved === 0 || holiday.status === 'pending') {
                    status = 'pending';
                    title += ' (Pending)';
                }
            } else {
                const dayOfWeek = d.getDay();
                if (dayOfWeek === 6 || dayOfWeek === 0 || dayOfWeek === 5) {
                    type = 'weekend';
                }
            }

            // CHECK FOR BOOKING OVERLAP
            const isBooked = isDateBooked(d);
            if (isBooked) {
                // Determine functionality for booked dates.
                // We show them as 'booked' and prevent editing.
                type = 'booked';
                title = 'Booked'; // or 'Locked'
                id = `booked-${dateStr}`;
                // Keep price visible? Maybe, but title usually overrides.
                // If it's a holiday AND booked, we probably still show 'Booked' as primary status to block edit.
            }

            generatedEvents.push({
                id: id,
                title: type === 'booked' ? 'Booked' : `₹${price}`,
                subtitle: type === 'booked' ? (holiday ? holiday.name : '') : title,
                start: new Date(d),
                end: new Date(d),
                allDay: true,
                price: price,
                type: type,
                status: status,
                resource: resource,
                booked: isBooked // Helper flag
            });
        }

        setEvents(generatedEvents);

    }, [currentDate, holidays, selectedPropertyId, properties, bookings]);


    const handleSelectSlot = ({ start, end }) => {
        // Prevent past dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (start < today) {
            return;
        }

        // CHECK FOR BOOKING CONFLICT
        // If any date in range is booked, prevent selection
        const check = new Date(start);
        const final = new Date(end);
        // Normalize final for loop (exclusive)
        // If end is 00:00 of next day, simple loop works

        let hasBooking = false;
        let hasExistingRate = false;

        while (check < final) {
            // 1. Check for Bookings
            if (isDateBooked(check)) {
                hasBooking = true;
            }

            // 2. Check for Existing Custom Rate (Holiday)
            const dStr = format(check, 'yyyy-MM-dd');
            // Check computed events (which includes holidays)
            // Note: 'events' state is derived from holidays, so we can check 'holidays' directly or 'events'.
            // Checking 'events' is safer as it handles the mapping logic.
            const dayEvent = events.find(e =>
                e.start.getDate() === check.getDate() &&
                e.start.getMonth() === check.getMonth() &&
                e.start.getFullYear() === check.getFullYear() &&
                e.type === 'holiday'
            );

            if (dayEvent) {
                hasExistingRate = true;
            }

            if (hasBooking || hasExistingRate) break;

            check.setDate(check.getDate() + 1);
        }

        if (hasBooking) {
            showInfo("Selected range includes booked dates. Holidays cannot be modified for booked dates.");
            return;
        }

        if (hasExistingRate) {
            showInfo("A custom rate already exists for this period. Please edit the existing rate instead.");
            return;
        }

        const property = properties.find(p => (p.id || p.PropertyId) == selectedPropertyId);

        // Normalize End Date
        const endDate = new Date(end);
        endDate.setDate(endDate.getDate() - 1);
        const normalizedEnd = new Date(end);
        if (normalizedEnd.getHours() === 0 && normalizedEnd.getMinutes() === 0 && normalizedEnd > start) {
            normalizedEnd.setDate(normalizedEnd.getDate() - 1);
        }

        // PREFILL PRICE: Calculate price for the START date
        const currentPrice = getPriceForDate(start, property);

        setRange({ start, end: normalizedEnd });
        setForm({
            name: '',
            base_price: currentPrice > 0 ? currentPrice : '', // Prefill!
            extra_person_price: ''
        });
        setEditData(null);
        setIsModalOpen(true);
    };

    const handleSelectEvent = (event) => {
        if (event.booked) {
            showInfo("This date is booked/locked and cannot be edited.");
            return;
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (event.start < today) {
            return;
        }

        if (event.type === 'holiday' && event.resource) {
            setEditData(event.resource);
            setRange({
                start: new Date(event.resource.from_date),
                end: new Date(event.resource.to_date)
            });
            setForm({
                name: event.resource.name,
                base_price: event.resource.base_price,
                extra_person_price: event.resource.extra_person_price
            });
            setIsModalOpen(true);
        } else {
            setRange({ start: event.start, end: event.start });
            setForm({ name: 'Custom Rate', base_price: event.price, extra_person_price: '' });
            setEditData(null);
            setIsModalOpen(true);
        }
    };

    const validatePrice = (newPrice) => {
        const property = properties.find(p => (p.id || p.PropertyId) == selectedPropertyId);
        if (!property) return true; // Safety

        const priceMonThu = parseFloat(property.pricing?.weekday || property.price_mon_thu || 0);
        const priceFriSun = parseFloat(property.pricing?.weekend || property.price_fri_sun || property.price || 0);
        const priceSat = parseFloat(property.pricing?.saturday || property.price_sat || priceFriSun);

        // Iterate date range
        let current = new Date(range.start);
        const end = new Date(range.end);

        while (current <= end) {
            const basePrice = getPriceForDate(current, property);

            if (basePrice > 0) {
                const minAllowed = basePrice * 0.8; // Max 20% decrease
                const maxAllowed = basePrice * 2.0; // Max 100% increase (double)

                if (newPrice < minAllowed) {
                    showError("Price Validation Failed", `Price cannot be less than ₹${minAllowed} (20% limit) for ${format(current, 'EEE, MM/dd')}`);
                    return false;
                }
                if (newPrice > maxAllowed) {
                    showError("Price Validation Failed", `Price cannot be more than ₹${maxAllowed} (100% limit) for ${format(current, 'EEE, MM/dd')}`);
                    return false;
                }
            }
            current.setDate(current.getDate() + 1);
        }
        return true;
    };


    const handleSave = async () => {
        if (!selectedPropertyId) return showError("Error", "No property selected");
        if (!form.base_price) return showError("Error", "Price is required");

        const priceVal = parseFloat(form.base_price);
        if (!validatePrice(priceVal)) return;

        // ... (rest of logic same)
        const payload = {
            property_id: selectedPropertyId,
            name: form.name || 'Custom Rate',
            from_date: format(range.start, 'yyyy-MM-dd'),
            to_date: format(range.end, 'yyyy-MM-dd'),
            base_price: form.base_price,
            extra_person_price: form.extra_person_price || 0
        };

        setLoading(true);
        try {
            if (editData) {
                await axios.delete(`${API_BASE_URL}/holidays/${editData.id}`, { headers: { Authorization: `Bearer ${token}` } });
            }

            await axios.post(`${API_BASE_URL}/holidays`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            await showSuccess("Saved", "Rate updated successfully! Admin might review if unusual.");
            setIsModalOpen(false);
            fetchHolidays();
        } catch (error) {
            console.error(error);
            showError("Error", "Failed to save rate");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!editData) return;
        const confirmed = await showConfirm("Delete Rate", "Revert to standard base rate?");
        if (!confirmed) return;

        try {
            await axios.delete(`${API_BASE_URL}/holidays/${editData.id}`, { headers: { Authorization: `Bearer ${token}` } });
            showSuccess("Deleted", "Reverted to base rate");
            setIsModalOpen(false);
            fetchHolidays();
        } catch (error) {
            showError("Error", "Failed to delete");
        }
    };



    const CustomToolbar = (toolbar) => {
        const goToBack = () => toolbar.onNavigate('PREV');
        const goToNext = () => toolbar.onNavigate('NEXT');
        const label = () => <span className="text-lg md:text-xl font-extrabold text-gray-900 capitalize tracking-tight min-w-[150px] md:min-w-[200px] text-center">{format(toolbar.date, 'MMMM yyyy')}</span>;



        return (
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 md:mb-8 gap-4 md:gap-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
                    <div className="flex items-center gap-4">
                        <div className="bg-rose-50 p-2 rounded-lg text-rose-500 hidden md:block">
                            <FaMoneyBillWave size={24} />
                        </div>
                        <div>
                            <h1 className="text-lg md:text-xl font-extrabold text-gray-900">Rate Manager</h1>
                            <p className="text-[10px] md:text-xs text-gray-500 font-medium hidden md:block">Click any date to override prices</p>
                        </div>
                    </div>
                </div>

                {/* Filter & Nav Grouped on Mobile */}
                <div className="flex w-full md:w-auto items-center justify-between gap-2">
                    {selectedPropertyId && (() => {
                        const property = properties.find(p => (p.id || p.PropertyId) == selectedPropertyId);
                        if (!property) return null;

                        const baseUrl = window.location.hostname.includes('localhost') ? 'http://localhost:5173' : window.location.origin;
                        const publicUrl = `${baseUrl}/calendar/${property.PropertyId || property.id}`;
                        const text = `Check availability for *${property.Name || property.ShortName}* here: ${publicUrl}`;
                        const shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;

                        return (
                            <a
                                href={shareUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => {
                                    navigator.clipboard.writeText(text).then(() => {
                                        showSuccess('Link Copied', 'Link also copied to clipboard.');
                                    }).catch(console.error);
                                }}
                                className="flex items-center gap-2 bg-[#25D366] hover:bg-[#20be5c] text-white px-3 py-2 rounded-xl font-bold shadow-sm transition-all text-xs md:text-sm whitespace-nowrap no-underline"
                                title="Share Public Calendar"
                            >
                                <FaWhatsapp size={16} /> <span className="hidden md:inline">Share Availability</span>
                            </a>
                        );
                    })()}
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 flex-1 md:flex-none">
                        <FaFilter className="text-gray-400 text-xs" />
                        <select
                            value={selectedPropertyId}
                            onChange={(e) => setSelectedPropertyId(e.target.value)}
                            className="bg-transparent outline-none font-bold text-gray-700 w-full md:min-w-[150px] cursor-pointer text-xs md:text-sm truncate"
                        >
                            {properties.map(p => (
                                <option key={p.id || p.PropertyId} value={p.id || p.PropertyId}>{p.Name || p.ShortName}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl">
                        <button onClick={goToBack} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white shadow-sm transition text-gray-600"><FaArrowLeft size={12} /></button>
                        <span className="text-xs font-bold w-20 text-center md:hidden">{format(toolbar.date, 'MMM yyyy')}</span>
                        <span className="hidden md:inline">{label()}</span>
                        <button onClick={goToNext} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white shadow-sm transition text-gray-600"><FaArrowRight size={12} /></button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex min-h-screen bg-gray-50/50">
            <Sidebar activePage="/holiday-management" />

            <div className="flex-1 md:ml-[70px] p-2 md:p-8 transition-all">
                {/* CALENDAR */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-gray-200/50 border border-white/20 p-2 md:p-6 h-[700px] md:h-[800px] relative flex flex-col">
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 left-0 w-full h-full bg-grid-slate-50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] pointer-events-none" />

                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%', flex: 1 }}
                        onNavigate={date => setCurrentDate(date)}
                        date={currentDate}
                        selectable
                        onSelectSlot={handleSelectSlot}
                        onSelectEvent={handleSelectEvent}
                        eventPropGetter={(event) => {
                            // Minimal container style, we delegate to the content component for visuals
                            return {
                                style: {
                                    backgroundColor: 'transparent',
                                    padding: '1px',
                                    border: 'none',
                                    outline: 'none'
                                }
                            };
                        }}
                        views={['month']}
                        components={{
                            toolbar: CustomToolbar,
                            event: ({ event }) => {
                                const isHoliday = event.type === 'holiday';
                                const isWeekend = event.type === 'weekend';
                                const isBooked = event.type === 'booked';

                                return (
                                    <div className={`
                                        h-full w-full rounded-md md:rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-200 group relative overflow-hidden px-1
                                        ${isBooked ? 'bg-gray-100 border border-gray-200 opacity-80 cursor-not-allowed' :
                                            isHoliday ? (event.status === 'pending' ? 'bg-purple-50 border border-purple-200' : 'bg-rose-50 border border-rose-100') :
                                                isWeekend ? 'bg-blue-50 border border-blue-100' :
                                                    'bg-white border hover:border-gray-300 border-gray-100'}
                                    `}>
                                        {/* Status Indicator Bar */}
                                        <div className={`absolute top-0 left-0 right-0 h-0.5 md:h-1 ${isBooked ? 'bg-gray-400' :
                                            isHoliday ? (event.status === 'pending' ? 'bg-purple-400' : 'bg-rose-400') :
                                                isWeekend ? 'bg-blue-400' : 'bg-transparent'
                                            }`} />

                                        <span className={`text-[10px] md:text-base font-bold tracking-tight ${isBooked ? 'text-gray-500 decoration-2' :
                                            isHoliday ? (event.status === 'pending' ? 'text-purple-700' : 'text-rose-700') :
                                                isWeekend ? 'text-blue-700' :
                                                    'text-gray-700'
                                            } font-mono`}>
                                            {event.title}
                                        </span>

                                        {event.subtitle && (
                                            <span className={`text-[8px] md:text-[9px] uppercase font-bold tracking-widest px-1 py-px rounded-full max-w-[90%] truncate hidden md:block
                                                ${isBooked ? 'bg-gray-200 text-gray-600' :
                                                    isHoliday ? (event.status === 'pending' ? 'bg-purple-100 text-purple-600' : 'bg-rose-100 text-rose-600') : 'bg-gray-100 text-gray-400'}
                                            `}>
                                                {event.subtitle}
                                            </span>
                                        )}

                                        {/* Lock Icon for Booked */}
                                        {isBooked && (
                                            <div className="absolute top-1 right-1 text-gray-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                        }}
                    />
                    {!selectedPropertyId && (
                        <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-md flex items-center justify-center">
                            <div className="bg-white p-8 rounded-3xl shadow-2xl text-center border border-gray-100 max-w-sm mx-4 transform transition-all hover:scale-105 duration-300">
                                <div className="bg-rose-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500 shadow-inner">
                                    <FaMoneyBillWave size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Select Property</h3>
                                <p className="text-gray-500 mb-8 text-sm leading-relaxed px-4">
                                    Choose a Villa or Stay to manage its holiday rates and calendar availability.
                                </p>

                                <div className="relative group">
                                    <select
                                        value={selectedPropertyId}
                                        onChange={(e) => setSelectedPropertyId(e.target.value)}
                                        className="w-full appearance-none bg-gray-50 hover:bg-gray-100 border-2 border-gray-100 hover:border-gray-200 text-gray-800 font-bold py-4 px-6 rounded-xl focus:outline-none focus:ring-0 focus:border-black transition-all cursor-pointer"
                                    >
                                        <option value="">-- Choose Property --</option>
                                        {properties.map(p => (
                                            <option key={p.id || p.PropertyId} value={p.id || p.PropertyId}>
                                                {p.Name || p.ShortName}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div >

            {/* MODAL */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                            <div className="bg-gradient-to-r from-gray-900 to-black p-6 text-white flex justify-between items-center">
                                <h3 className="text-xl font-bold flex items-center gap-3">
                                    <FaMoneyBillWave className="text-rose-400" />
                                    {editData ? 'Edit Rate' : 'Set Daily Rate'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="opacity-70 hover:opacity-100 text-2xl">&times;</button>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                                    <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Selected Dates</span>
                                    <div className="text-lg font-bold text-gray-800 mt-1">
                                        {range.start && format(range.start, 'MMM dd')}
                                        {range.end && range.start?.getTime() !== range.end?.getTime() && ` - ${format(range.end, 'MMM dd')}`}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Daily Price (₹)</label>
                                        <input
                                            type="number"
                                            value={form.base_price}
                                            onChange={e => setForm({ ...form, base_price: e.target.value })}
                                            className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-2xl font-black text-gray-900 focus:border-black focus:ring-0 outline-none transition-colors"
                                            placeholder="0"
                                            autoFocus
                                        />
                                        <p className="text-[10px] text-gray-400 mt-1">Max 20% decrease, 100% increase allowed based on standard rate.</p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Label (Optional)</label>
                                        <input
                                            type="text"
                                            value={form.name}
                                            onChange={e => setForm({ ...form, name: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-800 focus:bg-white focus:border-gray-400 outline-none transition-all"
                                            placeholder="e.g. Diwali Peak, Christmas"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    {editData && (
                                        <button
                                            onClick={handleDelete}
                                            disabled={loading}
                                            className="bg-red-50 text-red-600 px-6 py-3 rounded-xl font-bold hover:bg-red-100 transition flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            <FaTrash /> Revert
                                        </button>
                                    )}
                                    <button
                                        onClick={handleSave}
                                        disabled={loading}
                                        className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition shadow-lg flex-1 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Saving...
                                            </>
                                        ) : (
                                            'Save Rate'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            <style>{`
                 /* Mobile Calendar Tweaks */
                 @media (max-width: 768px) {
                    .rbc-calendar { min-height: 500px; }
                    .rbc-toolbar { flex-direction: column; gap: 10px; }
                    .rbc-header { font-size: 10px; padding: 2px; text-transform: uppercase; }
                    .rbc-event { padding: 0 !important; }
                    .rbc-date-cell { font-size: 10px; padding: 2px; }
                    /* Increase cell height slightly for touch targets if needed */
                    .rbc-month-row { overflow: visiblebox; }
                 }
            `}</style>
        </div >
    );
}
