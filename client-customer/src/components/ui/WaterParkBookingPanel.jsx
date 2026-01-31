import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfDay } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import { FaMinus, FaPlus, FaCalendarAlt, FaCheck, FaInfoCircle, FaArrowRight, FaTicketAlt } from 'react-icons/fa';
import 'react-day-picker/style.css';

export default function WaterParkBookingPanel({
    property,
    guests,
    setGuests,
    dateRange,
    priceBreakdown,
    isDatePickerOpen,
    setIsDatePickerOpen,
    handleDateSelect,
    datePickerRef,
    bookedDates = [],
    pricing,
    getPriceForDate,
    handleReserve,
    isWaterpark, // Should be true for this component
    minPrice
}) {

    // Derived Calculations
    const effectiveDate = dateRange?.from ? new Date(dateRange.from) : new Date();
    const adultRate = getPriceForDate(effectiveDate) || property.Price || 0;

    // Calculate market rate logic (Mock or real)
    const marketRate = (pricing && pricing.marketPrice && pricing.sellingPrice)
        ? Math.round(adultRate * (pricing.marketPrice / pricing.sellingPrice))
        : Math.round(adultRate * 1.25);

    const percentage = pricing ? pricing.percentage : 20;

    // Guest Handlers
    const updateGuests = (type, delta) => {
        setGuests(prev => ({
            ...prev,
            [type]: Math.max(type === 'adults' ? 1 : 0, prev[type] + delta)
        }));
    };

    return (
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 relative">
            {/* Header / Price Section - Consistent with Breakdown */}
            <div className="p-3 pb-2 bg-gradient-to-b from-blue-50/30 to-white rounded-t-3xl border-b border-gray-50">
                <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-gray-400 font-medium line-through">
                                ₹{(priceBreakdown?.adultMarketRate || marketRate).toLocaleString()}
                            </span>
                            <span className="text-[9px] font-bold text-green-600 bg-green-50 px-1 rounded">
                                -{percentage}%
                            </span>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-black text-gray-900">
                                ₹{(priceBreakdown?.adultTicketRate || adultRate).toLocaleString()}
                            </span>
                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">/ person</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-4 py-3 space-y-4">

                {/* Date Selection */}
                <div className="relative" ref={datePickerRef}>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Visit Date</label>
                    <button
                        onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${isDatePickerOpen ? 'border-black bg-gray-50' : 'border-gray-100 bg-white hover:border-gray-300'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-sm">
                                <FaCalendarAlt />
                            </div>
                            <div className="text-left">
                                <div className={`text-sm font-bold leading-tight ${dateRange.from ? 'text-gray-900' : 'text-gray-400'}`}>
                                    {dateRange.from ? format(dateRange.from, 'EEE, dd MMM yyyy') : 'Select Date'}
                                </div>
                                <div className="text-[9px] text-gray-400 font-medium mt-0.5">
                                    {dateRange.from ? 'Date Selected' : 'Tap to select'}
                                </div>
                            </div>
                        </div>
                    </button>

                    {/* Date Picker Dropdown */}
                    <AnimatePresence>
                        {isDatePickerOpen && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute top-full left-0 right-0 mt-2 z-[9999] bg-white rounded-2xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.3)] border border-gray-100 p-4"
                                style={{ minWidth: '300px' }} // Ensure width
                            >
                                <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-50">
                                    <h3 className="font-bold text-gray-900">Select Date</h3>
                                    <button onClick={() => setIsDatePickerOpen(false)} className="text-xs font-bold text-gray-400 hover:text-black">CLOSE</button>
                                </div>
                                <style>{`
                                    .rdp { --rdp-cell-size: 32px; margin: 0; }
                                    .rdp-months { justify-content: center; }
                                `}</style>
                                <DayPicker
                                    mode="single"
                                    selected={dateRange.from}
                                    onDayClick={handleDateSelect}
                                    numberOfMonths={1}
                                    modifiers={{ booked: (date) => bookedDates.includes(format(date, 'yyyy-MM-dd')) }}
                                    disabled={[
                                        { before: startOfDay(new Date()) },
                                        ...bookedDates.map(d => parse(d, 'yyyy-MM-dd', new Date()))
                                    ]}
                                    classNames={{
                                        day_button: "h-8 w-8 !p-0 font-normal aria-selected:opacity-100 bg-transparent hover:bg-gray-100 border border-transparent hover:border-gray-200 rounded-lg transition-all flex flex-col items-center justify-center gap-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 disabled:line-through",
                                        selected: "!bg-black !text-white hover:!bg-black hover:!text-white",
                                        day_selected: "!bg-black !text-white"
                                    }}
                                    components={{
                                        DayButton: (props) => {
                                            const { day, children, className, modifiers, ...buttonProps } = props;
                                            const date = day?.date;
                                            if (!date) return <button className={className} {...buttonProps}>{children}</button>;

                                            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                            const isPastDate = buttonProps.disabled;
                                            const isBooked = modifiers.booked;
                                            let price = getPriceForDate(date);
                                            price = parseFloat(price);

                                            let combinedClassName = `${className || ''} flex flex-col items-center justify-center gap-0.5 h-full w-full py-1 transition-all duration-200`.trim();
                                            if (isPastDate) combinedClassName += " opacity-50 cursor-not-allowed bg-gray-50 text-gray-300 line-through";
                                            else if (isBooked) combinedClassName += " relative overflow-hidden bg-red-50/50 text-red-300 decoration-red-300 line-through hover:bg-red-50";

                                            return (
                                                <button
                                                    className={combinedClassName}
                                                    {...buttonProps}
                                                    disabled={buttonProps.disabled}
                                                    style={{ pointerEvents: buttonProps.disabled ? 'none' : 'auto' }}
                                                >
                                                    <span className={`text-[13px] font-medium leading-tight ${isWeekend && !isBooked ? 'text-red-600 font-bold' : ''}`}>
                                                        {children}
                                                    </span>
                                                    {!isPastDate && !isBooked && (
                                                        <span className="text-[8px] font-bold leading-tight text-green-600">
                                                            {price > 0 ? (price >= 1000 ? `₹${(price / 1000).toFixed(1)}k` : `₹${price}`) : ''}
                                                        </span>
                                                    )}
                                                    {isBooked && <span className="text-[8px] font-bold leading-tight text-red-400">Sold</span>}
                                                </button>
                                            );
                                        }
                                    }}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Ticket Selection */}
                <div className="pt-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Add Tickets</label>
                    <div className="space-y-2">
                        {/* Adult Row */}
                        <div className="flex items-center justify-between p-2 border border-gray-100 rounded-xl bg-white shadow-sm">
                            <div className="flex flex-col">
                                <span className="font-bold text-gray-900 text-xs">Adults</span>
                                <span className="text-[9px] text-gray-400">Above 8 years</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <button
                                    onClick={() => updateGuests('adults', -1)}
                                    className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center text-gray-600 border border-gray-100"
                                >
                                    <FaMinus size={6} />
                                </button>
                                <span className="font-bold text-sm w-4 text-center">{guests.adults}</span>
                                <button
                                    onClick={() => updateGuests('adults', 1)}
                                    className="w-6 h-6 rounded-lg bg-black text-white flex items-center justify-center shadow-sm"
                                >
                                    <FaPlus size={6} />
                                </button>
                            </div>
                        </div>

                        {/* Child Row */}
                        <div className="flex items-center justify-between p-2 border border-gray-100 rounded-xl bg-white shadow-sm">
                            <div className="flex flex-col">
                                <span className="font-bold text-gray-900 text-xs">Children</span>
                                <span className="text-[9px] text-gray-400">3 to 8 years</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <button
                                    onClick={() => updateGuests('children', -1)}
                                    className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center text-gray-600 border border-gray-100"
                                >
                                    <FaMinus size={6} />
                                </button>
                                <span className="font-bold text-sm w-4 text-center">{guests.children}</span>
                                <button
                                    onClick={() => updateGuests('children', 1)}
                                    className="w-6 h-6 rounded-lg bg-black text-white flex items-center justify-center shadow-sm"
                                >
                                    <FaPlus size={6} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pricing Summary Breakdown */}
                <AnimatePresence>
                    {priceBreakdown && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-gray-50 rounded-xl p-3 border border-gray-100 overflow-hidden"
                        >
                            <div className="space-y-1.5 pt-1 border-t border-gray-100">
                                {/* Rate Breakdown */}
                                {priceBreakdown && (
                                    <div className="space-y-1 py-1 border-b border-gray-50 mb-1">
                                        <div className="flex justify-between text-[9px]">
                                            <div className="flex flex-col">
                                                <span className="text-gray-900 font-bold">Adults ({guests.adults})</span>
                                                <span className="text-gray-400">₹{priceBreakdown.adultTicketRate} x {guests.adults}</span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                {priceBreakdown.adultMarketRate > priceBreakdown.adultTicketRate && (
                                                    <span className="text-gray-400 line-through">₹{(priceBreakdown.adultMarketRate * guests.adults).toLocaleString()}</span>
                                                )}
                                                <span className="font-bold text-gray-900">₹{priceBreakdown.totalAdultTicket?.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        {guests.children > 0 && (
                                            <div className="flex justify-between text-[9px]">
                                                <div className="flex flex-col">
                                                    <span className="text-gray-900 font-bold">Children ({guests.children})</span>
                                                    <span className="text-gray-400">₹{priceBreakdown.childTicketRate} x {guests.children}</span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    {priceBreakdown.childMarketRate > priceBreakdown.childTicketRate && (
                                                        <span className="text-gray-400 line-through">₹{(priceBreakdown.childMarketRate * guests.children).toLocaleString()}</span>
                                                    )}
                                                    <span className="font-bold text-gray-900">₹{priceBreakdown.totalChildTicket?.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex justify-between text-[10px] font-medium text-gray-500">
                                    <span className="underline decoration-dotted decoration-gray-300">Tickets ({guests.adults + guests.children})</span>
                                    <span>₹{priceBreakdown.grantTotal?.toLocaleString()}</span>
                                </div>

                                <div className="flex justify-between items-baseline pt-1 border-t border-gray-100 border-dotted mt-1">
                                    <span className="text-[10px] font-bold text-gray-900 uppercase">Total Tickets</span>
                                    <span className="text-sm font-black text-gray-900">₹{priceBreakdown.grantTotal?.toLocaleString()}</span>
                                </div>

                                {/* Token Amount */}
                                <div className="bg-blue-50/50 rounded-lg p-2 mt-2 border border-blue-50">
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Pay Now</span>
                                            <span className="text-sm font-black text-gray-900 leading-none">₹{priceBreakdown.tokenAmount?.toLocaleString()}</span>
                                        </div>
                                        <div className="text-[8px] text-gray-400 font-bold uppercase text-right leading-tight">
                                            Pay at Park<br />
                                            <span className="text-gray-900 font-black">₹{(priceBreakdown.grantTotal - priceBreakdown.tokenAmount).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {priceBreakdown.totalSavings > 0 && (
                                    <div className="flex justify-between items-center bg-green-50 text-green-700 px-2 py-1 rounded-md border border-green-100 mt-2">
                                        <span className="text-[8px] font-bold uppercase tracking-wider">🎉 You Saved</span>
                                        <span className="text-[10px] font-black">₹{priceBreakdown.totalSavings.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>

            {/* Action Button Section */}
            <div className="p-4 pt-2 bg-white rounded-b-3xl">
                <button
                    onClick={handleReserve}
                    className="w-full bg-[#FF385C] hover:bg-[#D9324E] text-white py-3.5 rounded-xl font-bold text-base shadow-lg shadow-red-100 hover:shadow-red-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
                >
                    <FaTicketAlt className="text-white/90 group-hover:rotate-12 transition-transform" />
                    <span>{!dateRange.from ? 'Select Dates' : (priceBreakdown ? `Reserve Now (₹${priceBreakdown.tokenAmount?.toLocaleString()})` : 'Reserve Now')}</span>
                    {dateRange.from && <FaArrowRight className="text-sm opacity-80 group-hover:translate-x-1 transition-transform" />}
                </button>
                <div className="flex flex-col items-center mt-2.5">
                    <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1.5 font-medium">
                        <FaCheck className="text-green-500" /> Free Cancellation up to 24hrs
                    </p>
                    <div className="text-[9px] text-gray-300 mt-1 uppercase tracking-widest font-bold">
                        Instant Confirmation
                    </div>
                </div>
            </div>

        </div>
    );
}
