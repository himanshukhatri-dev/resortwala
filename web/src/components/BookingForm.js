import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Calendar, Users } from 'lucide-react';

const BookingForm = ({ property, onBook }) => {
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [guests, setGuests] = useState(1);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (startDate && endDate) {
            onBook({
                checkIn: startDate.toISOString(),
                checkOut: endDate.toISOString(),
                guests
            });
        }
    };

    const calculateTotal = () => {
        if (!startDate || !endDate) return 0;
        const nights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        return nights > 0 ? nights * property.pricePerNight : 0;
    };

    const total = calculateTotal();
    const nights = startDate && endDate ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) : 0;

    return (
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 sticky top-24 z-10">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <span className="text-2xl font-bold text-gray-900">₹{property.pricePerNight.toLocaleString()}</span>
                    <span className="text-gray-500"> / night</span>
                </div>
                <div className="flex items-center gap-1 text-sm bg-gray-50 px-2 py-1 rounded-md">
                    <span className="font-bold">★ {property.rating || 'New'}</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                    <div className="border rounded-lg p-3 relative hover:border-gray-400 transition-colors">
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Check-in</label>
                        <DatePicker
                            selected={startDate}
                            onChange={(date) => setStartDate(date)}
                            selectsStart
                            startDate={startDate}
                            endDate={endDate}
                            minDate={new Date()}
                            placeholderText="Add date"
                            className="w-full text-sm outline-none cursor-pointer font-medium"
                            dateFormat="dd MMM yyyy"
                        />
                        <Calendar className="w-4 h-4 text-gray-400 absolute top-3 right-3 pointer-events-none" />
                    </div>
                    <div className="border rounded-lg p-3 relative hover:border-gray-400 transition-colors">
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Check-out</label>
                        <DatePicker
                            selected={endDate}
                            onChange={(date) => setEndDate(date)}
                            selectsEnd
                            startDate={startDate}
                            endDate={endDate}
                            minDate={startDate}
                            placeholderText="Add date"
                            className="w-full text-sm outline-none cursor-pointer font-medium"
                            dateFormat="dd MMM yyyy"
                        />
                        <Calendar className="w-4 h-4 text-gray-400 absolute top-3 right-3 pointer-events-none" />
                    </div>
                </div>

                <div className="border rounded-lg p-3 relative hover:border-gray-400 transition-colors">
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Guests</label>
                    <input
                        type="number"
                        min="1"
                        max={property.maxGuests}
                        required
                        className="w-full text-sm outline-none font-medium"
                        value={guests}
                        onChange={(e) => setGuests(e.target.value)}
                    />
                    <Users className="w-4 h-4 text-gray-400 absolute top-3 right-3 pointer-events-none" />
                </div>

                <button
                    type="submit"
                    disabled={!startDate || !endDate}
                    className={`w-full font-bold py-3 rounded-lg transition-all transform active:scale-95 ${startDate && endDate
                            ? 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-lg hover:shadow-xl'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    Reserve
                </button>
            </form>

            {total > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100 space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex justify-between text-gray-600">
                        <span className="underline decoration-gray-300">₹{property.pricePerNight.toLocaleString()} x {nights} nights</span>
                        <span>₹{total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                        <span className="underline decoration-gray-300">Service fee</span>
                        <span>₹{Math.round(total * 0.1).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-3 border-t border-gray-100">
                        <span>Total</span>
                        <span>₹{(total + Math.round(total * 0.1)).toLocaleString()}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingForm;
