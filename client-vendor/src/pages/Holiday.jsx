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
import { FaArrowLeft, FaArrowRight, FaFilter, FaPlus, FaMoneyBillWave, FaTrash } from 'react-icons/fa';

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
            setProperties(response.data);
            if (response.data.length > 0) {
                setSelectedPropertyId(response.data[0].id || response.data[0].PropertyId);
            }
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
        // Ideally we only generate for the view, but for simplicity we generate a range

        const startGen = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        const endGen = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0);

        for (let d = new Date(startGen); d <= endGen; d.setDate(d.getDate() + 1)) {
            const dateStr = format(d, 'yyyy-MM-dd');
            const dayOfWeek = d.getDay(); // 0=Sun, 6=Sat

            // Check for Holiday Override
            const holiday = holidays.find(h => {
                // Check if holiday applies to this property
                const holidayPropId = h.property_id || h.property?.id || h.property?.PropertyId;
                // If holiday.property_id is null/undefined => Global holiday? (Assuming per property for now based on form)
                if (holidayPropId && String(holidayPropId) !== String(selectedPropertyId)) return false;

                const start = new Date(h.from_date);
                const end = new Date(h.to_date);
                start.setHours(0, 0, 0, 0);
                end.setHours(0, 0, 0, 0);
                const current = new Date(d);
                current.setHours(0, 0, 0, 0);
                return current >= start && current <= end;
            });

            let price = priceMonThu;
            let type = 'standard';
            let title = '';
            let id = `rate-${dateStr}`;
            let resource = null;

            if (holiday) {
                price = parseFloat(holiday.base_price || 0);
                type = 'holiday';
                title = holiday.name || 'Holiday';
                id = `holiday-${holiday.id}`;
                resource = holiday;
            } else {
                if (dayOfWeek === 6) { // Sat
                    price = priceSat;
                    type = 'weekend';
                } else if (dayOfWeek === 0 || dayOfWeek === 5) { // Fri, Sun
                    price = priceFriSun;
                    type = 'weekend';
                }
            }

            generatedEvents.push({
                id: id,
                title: `₹${price}`,
                subtitle: title, // For holiday name
                start: new Date(d),
                end: new Date(d),
                allDay: true,
                price: price,
                type: type,
                resource: resource
            });
        }

        setEvents(generatedEvents);

    }, [currentDate, holidays, selectedPropertyId, properties]);


    const handleSelectSlot = ({ start, end }) => {
        // Prevent past dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (start < today) {
            showError('Invalid Selection', 'You cannot update rates for past dates.');
            return;
        }

        // Adjust end date (BigCalendar 'end' is exclusive for slots, sometimes checks needed)
        // If clicking single day, start=end (or end=start+1 day).
        // Let's normalize.
        // If single click:
        const endDate = new Date(end);
        endDate.setDate(endDate.getDate() - 1); // Normalize exclusion if needed, usually BigCal selects ranges well.

        // Actually for single day click start is 00:00, end is next day 00:00
        const normalizedEnd = new Date(end);
        if (normalizedEnd.getHours() === 0 && normalizedEnd.getMinutes() === 0 && normalizedEnd > start) {
            normalizedEnd.setDate(normalizedEnd.getDate() - 1);
        }

        setRange({ start, end: normalizedEnd });
        setForm({ name: '', base_price: '', extra_person_price: '' });
        setEditData(null);
        setIsModalOpen(true);
    };

    const handleSelectEvent = (event) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (event.start < today) {
            showError('Past Date', 'You cannot modify rates for past dates.');
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
            // If clicking a standard date, treat as new override for that date
            setRange({ start: event.start, end: event.start });
            setForm({ name: 'Custom Rate', base_price: event.price, extra_person_price: '' });
            setEditData(null);
            setIsModalOpen(true);
        }
    };

    const handleSave = async () => {
        if (!selectedPropertyId) return showError("Error", "No property selected");
        if (!form.base_price) return showError("Error", "Price is required");

        const payload = {
            property_id: selectedPropertyId,
            name: form.name || 'Custom Rate',
            from_date: format(range.start, 'yyyy-MM-dd'),
            to_date: format(range.end, 'yyyy-MM-dd'),
            base_price: form.base_price,
            extra_person_price: form.extra_person_price || 0
        };

        try {
            if (editData) {
                await axios.delete(`${API_BASE_URL}/holidays/${editData.id}`, { headers: { Authorization: `Bearer ${token}` } });
            }

            await axios.post(`${API_BASE_URL}/holidays`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            await showSuccess("Saved", "Rate updated successfully!");
            setIsModalOpen(false);
            fetchHolidays();
        } catch (error) {
            console.error(error);
            showError("Error", "Failed to save rate");
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
        const label = () => <span className="text-xl font-extrabold text-gray-900 capitalize tracking-tight min-w-[200px] text-center">{format(toolbar.date, 'MMMM yyyy')}</span>;

        return (
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="bg-rose-50 p-2 rounded-lg text-rose-500">
                        <FaMoneyBillWave size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-extrabold text-gray-900">Rate Manager</h1>
                        <p className="text-xs text-gray-500 font-medium">Click any date to override prices</p>
                    </div>
                </div>

                {/* Filter */}
                <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
                    <FaFilter className="text-gray-400" />
                    <select
                        value={selectedPropertyId}
                        onChange={(e) => setSelectedPropertyId(e.target.value)}
                        className="bg-transparent outline-none font-bold text-gray-700 min-w-[150px] cursor-pointer text-sm"
                    >
                        {properties.map(p => (
                            <option key={p.id || p.PropertyId} value={p.id || p.PropertyId}>{p.Name || p.ShortName}</option>
                        ))}
                    </select>
                </div>

                {/* Nav */}
                <div className="flex items-center gap-2">
                    <button onClick={goToBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition text-gray-600"><FaArrowLeft /></button>
                    {label()}
                    <button onClick={goToNext} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition text-gray-600"><FaArrowRight /></button>
                </div>
            </div>
        );
    };

    return (
        <div className="flex min-h-screen bg-gray-50/50">
            <Sidebar activePage="/holiday-management" />

            <div className="flex-1 md:ml-[70px] p-4 md:p-8 transition-all">
                {/* CALENDAR */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-gray-200/50 border border-white/20 p-6 h-[800px] relative">
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 left-0 w-full h-full bg-grid-slate-50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] pointer-events-none" />

                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%' }}
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
                                    padding: '2px',
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

                                return (
                                    <div className={`
                                        h-full w-full rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-200 group relative overflow-hidden
                                        ${isHoliday ? 'bg-rose-50 border-2 border-rose-100' :
                                            isWeekend ? 'bg-blue-50 border-2 border-blue-100' :
                                                'bg-white border hover:border-gray-300 border-gray-100 hover:shadow-md'}
                                    `}>
                                        {/* Status Indicator Bar */}
                                        <div className={`absolute top-0 left-0 right-0 h-1 ${isHoliday ? 'bg-rose-400' : isWeekend ? 'bg-blue-400' : 'bg-transparent'}`} />

                                        <span className={`text-sm md:text-base font-bold tracking-tight px-2 py-0.5 rounded-md ${isHoliday ? 'text-rose-700' :
                                            isWeekend ? 'text-blue-700' :
                                                'text-gray-700'
                                            } font-mono`}>
                                            {event.title}
                                        </span>

                                        {event.subtitle && (
                                            <span className={`text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-full max-w-[90%] truncate
                                                ${isHoliday ? 'bg-rose-100 text-rose-600' : 'bg-gray-100 text-gray-400'}
                                            `}>
                                                {event.subtitle}
                                            </span>
                                        )}

                                        {/* Hover Edit Icon */}
                                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            {/* Icon can go here if needed */}
                                        </div>
                                    </div>
                                );
                            }
                        }}
                    />
                </div>
            </div>

            {/* MODAL */}
            {isModalOpen && (
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
                                        className="bg-red-50 text-red-600 px-6 py-3 rounded-xl font-bold hover:bg-red-100 transition flex-1 flex items-center justify-center gap-2"
                                    >
                                        <FaTrash /> Revert
                                    </button>
                                )}
                                <button
                                    onClick={handleSave}
                                    className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition shadow-lg flex-1"
                                >
                                    Save Rate
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
