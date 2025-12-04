import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Search, MapPin, Calendar, Users } from 'lucide-react';

const SearchBar = ({ onSearch }) => {
    const [location, setLocation] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [guests, setGuests] = useState(1);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSearch({ location, startDate, endDate, guests });
    };

    return (
        <div className="bg-white rounded-2xl shadow-2xl p-3 max-w-5xl mx-auto border border-gray-100">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">

                {/* Location */}
                <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500">
                        <MapPin className="w-5 h-5" />
                    </div>
                    <div className="pl-12 pr-4 py-3 hover:bg-gray-50 rounded-xl transition-all cursor-pointer border-2 border-transparent group-hover:border-rose-200">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                            Location
                        </label>
                        <input
                            type="text"
                            placeholder="Where to?"
                            className="w-full bg-transparent border-none p-0 text-gray-800 placeholder-gray-400 focus:ring-0 text-sm font-medium focus:outline-none"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        />
                    </div>
                </div>

                {/* Check In */}
                <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <div className="pl-12 pr-4 py-3 hover:bg-gray-50 rounded-xl transition-all cursor-pointer border-2 border-transparent group-hover:border-rose-200">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                            Check In
                        </label>
                        <DatePicker
                            selected={startDate}
                            onChange={(date) => setStartDate(date)}
                            selectsStart
                            startDate={startDate}
                            endDate={endDate}
                            minDate={new Date()}
                            placeholderText="Add date"
                            className="w-full bg-transparent border-none p-0 text-gray-800 focus:ring-0 text-sm font-medium cursor-pointer focus:outline-none"
                            dateFormat="dd MMM yyyy"
                            calendarClassName="shadow-2xl border-2 border-rose-100"
                        />
                    </div>
                </div>

                {/* Check Out */}
                <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <div className="pl-12 pr-4 py-3 hover:bg-gray-50 rounded-xl transition-all cursor-pointer border-2 border-transparent group-hover:border-rose-200">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                            Check Out
                        </label>
                        <DatePicker
                            selected={endDate}
                            onChange={(date) => setEndDate(date)}
                            selectsEnd
                            startDate={startDate}
                            endDate={endDate}
                            minDate={startDate || new Date()}
                            placeholderText="Add date"
                            className="w-full bg-transparent border-none p-0 text-gray-800 focus:ring-0 text-sm font-medium cursor-pointer focus:outline-none"
                            dateFormat="dd MMM yyyy"
                            calendarClassName="shadow-2xl border-2 border-rose-100"
                        />
                    </div>
                </div>

                {/* Guests + Search Button */}
                <div className="relative group flex items-center gap-2">
                    <div className="flex-1">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500 z-10">
                            <Users className="w-5 h-5" />
                        </div>
                        <div className="pl-12 pr-4 py-3 hover:bg-gray-50 rounded-xl transition-all cursor-pointer border-2 border-transparent group-hover:border-rose-200 h-full flex flex-col justify-center">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                Guests
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="20"
                                className="w-full bg-transparent border-none p-0 text-gray-800 focus:ring-0 text-sm font-medium focus:outline-none"
                                value={guests}
                                onChange={(e) => setGuests(e.target.value)}
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white p-4 rounded-xl shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center group"
                    >
                        <Search className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                    </button>
                </div>

            </form>

            {/* Custom DatePicker Styles */}
            <style jsx global>{`
                .react-datepicker {
                    font-family: inherit;
                    border: none;
                    border-radius: 1rem;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                }
                .react-datepicker__header {
                    background-color: #f9fafb;
                    border-bottom: 1px solid #f3f4f6;
                    border-radius: 1rem 1rem 0 0;
                    padding-top: 1rem;
                }
                .react-datepicker__current-month {
                    font-weight: 600;
                    color: #111827;
                    font-size: 1rem;
                }
                .react-datepicker__day-name {
                    color: #6b7280;
                    font-weight: 600;
                    font-size: 0.75rem;
                }
                .react-datepicker__day {
                    border-radius: 0.5rem;
                    transition: all 0.2s;
                    font-weight: 500;
                }
                .react-datepicker__day:hover {
                    background-color: #fce7f3;
                    color: #be123c;
                }
                .react-datepicker__day--selected {
                    background-color: #f43f5e !important;
                    color: white !important;
                    font-weight: 600;
                }
                .react-datepicker__day--keyboard-selected {
                    background-color: #fda4af;
                    color: #881337;
                }
                .react-datepicker__day--in-range {
                    background-color: #fecdd3;
                    color: #881337;
                }
                .react-datepicker__day--in-selecting-range {
                    background-color: #fecdd3;
                    color: #881337;
                }
                .react-datepicker__navigation-icon::before {
                    border-color: #f43f5e;
                }
                .react-datepicker__navigation:hover *::before {
                    border-color: #be123c;
                }
            `}</style>
        </div>
    );
};

export default SearchBar;
