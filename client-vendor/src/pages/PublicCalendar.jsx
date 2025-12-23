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
import { FaWhatsapp, FaCalendarAlt, FaMapMarkerAlt, FaCheckCircle, FaTimes } from 'react-icons/fa';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

const PublicCalendar = () => {
    const { id } = useParams(); // Property ID
    const [property, setProperty] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [bookingForm, setBookingForm] = useState({
        customer_name: '',
        customer_mobile: '',
        customer_email: '',
        check_in: '',
        check_out: '',
        guests: 1
    });
    const [submitting, setSubmitting] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/public/properties/${id}/calendar`);

                setProperty(res.data.property);

                const formattedEvents = res.data.events.map(evt => ({
                    ...evt,
                    start: new Date(evt.start),
                    end: new Date(evt.end),
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

    const handleSelectSlot = ({ start }) => {
        setSelectedDate(start);
        setBookingForm({
            ...bookingForm,
            check_in: format(start, 'yyyy-MM-dd'),
            check_out: format(new Date(start.getTime() + 86400000), 'yyyy-MM-dd') // Next day
        });
        setShowBookingForm(true);
    };

    const handleWhatsAppInquiry = () => {
        if (!property) return;

        let text = `Hi, I am interested in booking *${property.name}*.`;
        if (selectedDate) {
            text += `\\nI checked the calendar for: ${format(selectedDate, 'dd MMM yyyy')}.`;
        }
        text += `\\nPlease let me know the availability and pricing.`;

        const phoneNumber = property.vendor_phone || "";

        if (!phoneNumber) {
            alert("Contact number not available for this property.");
            return;
        }

        const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    const handleBookingSubmit = async (e) => {
        e.preventDefault();

        if (!bookingForm.customer_name || !bookingForm.customer_mobile) {
            alert('Please fill in your name and mobile number');
            return;
        }

        setSubmitting(true);
        try {
            await axios.post(`${API_BASE_URL}/bookings`, {
                PropertyId: property.id,
                CustomerName: bookingForm.customer_name,
                CustomerMobile: bookingForm.customer_mobile,
                CustomerEmail: bookingForm.customer_email,
                CheckInDate: bookingForm.check_in,
                CheckOutDate: bookingForm.check_out,
                Guests: bookingForm.guests,
                TotalAmount: 0, // Will be calculated by vendor
                payment_method: 'hotel',
                booking_source: 'public_calendar'
            });

            setBookingSuccess(true);
            setShowBookingForm(false);

            // Reset form
            setTimeout(() => {
                setBookingSuccess(false);
                setBookingForm({
                    customer_name: '',
                    customer_mobile: '',
                    customer_email: '',
                    check_in: '',
                    check_out: '',
                    guests: 1
                });
            }, 5000);
        } catch (err) {
            console.error('Booking error:', err);
            alert(err.response?.data?.message || 'Failed to submit booking request. Please try again or contact via WhatsApp.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-500 font-bold">Loading Calendar...</div>;
    if (error) return <div className="flex items-center justify-center min-h-screen text-red-500 font-bold">{error}</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white px-4 py-6 shadow-sm border-b sticky top-0 z-50">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight leading-tight">{property.name}</h1>
                        <p className="text-gray-500 text-sm flex items-center gap-1"><FaMapMarkerAlt className="text-indigo-500" /> {property.city}, {property.location}</p>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-4 mt-6">
                {/* Images or Cover */}
                {property.images && property.images.length > 0 && (
                    <div className="mb-8 rounded-3xl overflow-hidden shadow-lg aspect-video relative">
                        <img src={property.images[0].image_url || property.images[0].image_path} alt={property.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                            <span className="text-white font-bold px-4 py-2 bg-white/20 backdrop-blur-md rounded-lg border border-white/30">
                                ₹ {property.price_mon_thu} / night
                            </span>
                        </div>
                    </div>
                )}

                {/* Success Message */}
                {bookingSuccess && (
                    <div className="mb-6 bg-green-50 border-2 border-green-500 rounded-2xl p-6 flex items-start gap-4">
                        <FaCheckCircle className="text-green-500 text-3xl flex-shrink-0 mt-1" />
                        <div>
                            <h3 className="font-bold text-green-800 text-lg">Booking Request Sent!</h3>
                            <p className="text-green-700 mt-1">Your booking request has been sent to the property owner. They will contact you shortly at {bookingForm.customer_mobile} to confirm your booking.</p>
                        </div>
                    </div>
                )}

                {/* Calendar */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden p-6 mb-24">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2"><FaCalendarAlt className="text-indigo-600" /> Availability</h3>
                        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider">
                            <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-100 border border-red-500"></div> Booked</span>
                            <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-white border border-gray-300"></div> Available</span>
                        </div>
                    </div>

                    <div className="h-[500px] public-calendar">
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
                                className: 'bg-red-500 text-white border-0 opacity-80 pointer-events-none',
                                style: { backgroundColor: '#EF4444', color: 'white' }
                            })}
                        />
                    </div>
                </div>
            </div>

            {/* Booking Form Modal */}
            {showBookingForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-8 relative">
                        <button
                            onClick={() => setShowBookingForm(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <FaTimes size={24} />
                        </button>

                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Book Your Stay</h2>
                        <p className="text-gray-500 text-sm mb-6">Fill in your details to request a booking</p>

                        <form onSubmit={handleBookingSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Your Name *</label>
                                <input
                                    type="text"
                                    value={bookingForm.customer_name}
                                    onChange={(e) => setBookingForm({ ...bookingForm, customer_name: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Mobile Number *</label>
                                <input
                                    type="tel"
                                    value={bookingForm.customer_mobile}
                                    onChange={(e) => setBookingForm({ ...bookingForm, customer_mobile: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="+91 98765 43210"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Email (Optional)</label>
                                <input
                                    type="email"
                                    value={bookingForm.customer_email}
                                    onChange={(e) => setBookingForm({ ...bookingForm, customer_email: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="john@example.com"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Check-in</label>
                                    <input
                                        type="date"
                                        value={bookingForm.check_in}
                                        onChange={(e) => setBookingForm({ ...bookingForm, check_in: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Check-out</label>
                                    <input
                                        type="date"
                                        value={bookingForm.check_out}
                                        onChange={(e) => setBookingForm({ ...bookingForm, check_out: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Number of Guests</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={bookingForm.guests}
                                    onChange={(e) => setBookingForm({ ...bookingForm, guests: parseInt(e.target.value) })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>

                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                                <strong>Note:</strong> This is a booking request. The property owner will contact you to confirm availability and pricing.
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Sending Request...' : 'Request Booking'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Bottom Floating Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-40">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Interested?</p>
                        <p className="text-sm font-medium text-gray-900">Select dates to book</p>
                    </div>
                    <button
                        onClick={handleWhatsAppInquiry}
                        className="flex-1 max-w-xs bg-[#25D366] hover:bg-[#1ebc57] text-white py-3.5 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-200"
                    >
                        <FaWhatsapp size={20} />
                        {selectedDate ? `Inquire for ${format(selectedDate, 'MMM dd')}` : 'WhatsApp Inquiry'}
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
                .rbc-event { border-radius: 4px; }
            `}</style>
        </div>
    );
};

export default PublicCalendar;
