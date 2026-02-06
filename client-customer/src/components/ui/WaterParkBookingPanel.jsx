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

            <div className="px-4 py-2 space-y-2">

                {/* Date Selection */}
                <div className="relative" ref={datePickerRef}>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Visit Date</label>
                    <button
                        onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl border-2 transition-all ${isDatePickerOpen ? 'border-black bg-gray-50' : 'border-gray-100 bg-white hover:border-gray-300'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#FF385C]/10 text-[#FF385C] flex items-center justify-center text-lg">
                                <FaCalendarAlt />
                            </div>
                            <div className="text-left">
                                <div className={`text-base font-bold leading-tight ${dateRange.from ? 'text-gray-900' : 'text-gray-400'}`}>
                                    {dateRange.from ? format(dateRange.from, 'EEE, dd MMM yyyy') : 'Select Date'}
                                </div>
                                <div className="text-[10px] text-gray-400 font-medium mt-0.5">
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

                <div className="pt-1">
                    <div className="grid grid-cols-2 gap-2">
                        {/* Adult Row */}
                        <div className="flex items-center justify-between p-2 border border-gray-100 rounded-lg bg-white shadow-sm">
                            <div className="flex flex-col leading-tight">
                                <span className="font-bold text-gray-900 text-[10px]">Adult (8 yrs+)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => updateGuests('adults', -1)}
                                    className="w-6 h-6 rounded bg-gray-50 flex items-center justify-center text-gray-600 border border-gray-100 shadow-sm"
                                >
                                    <FaMinus size={6} />
                                </button>
                                <span className="font-bold text-xs w-3 text-center">{guests.adults}</span>
                                <button
                                    onClick={() => updateGuests('adults', 1)}
                                    className="w-6 h-6 rounded bg-black text-white flex items-center justify-center shadow-sm"
                                >
                                    <FaPlus size={6} />
                                </button>
                            </div>
                        </div>

                        {/* Child Row */}
                        <div className="flex items-center justify-between p-2 border border-gray-100 rounded-lg bg-white shadow-sm">
                            <div className="flex flex-col leading-tight">
                                <span className="font-bold text-gray-900 text-[10px]">Child (3-8 y)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => updateGuests('children', -1)}
                                    className="w-6 h-6 rounded bg-gray-50 flex items-center justify-center text-gray-600 border border-gray-100 shadow-sm"
                                >
                                    <FaMinus size={6} />
                                </button>
                                <span className="font-bold text-xs w-3 text-center">{guests.children}</span>
                                <button
                                    onClick={() => updateGuests('children', 1)}
                                    className="w-6 h-6 rounded bg-black text-white flex items-center justify-center shadow-sm"
                                >
                                    <FaPlus size={6} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pricing Summary - MOBILE ONLY, REORDERED */}
                <AnimatePresence>
                    {priceBreakdown && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-gray-50 rounded-xl p-2 border border-gray-100 overflow-hidden mt-1.5"
                        >
                            <div className="space-y-2 pt-0.5">
                                {/* Ticket Breakdown */}
                                <div className="space-y-1 pb-1.5">
                                    <div className="flex justify-between text-[10px]">
                                        <div className="flex flex-col">
                                            <span className="text-gray-900 font-bold">Adult ({guests.adults})</span>
                                            <span className="text-gray-400">₹{priceBreakdown.adultTicketRate.toLocaleString()} x {guests.adults}</span>
                                        </div>
                                        <span className="font-bold text-gray-900">₹{priceBreakdown.totalAdultTicket?.toLocaleString()}</span>
                                    </div>
                                    {guests.children > 0 && (
                                        <div className="flex justify-between text-[10px]">
                                            <div className="flex flex-col">
                                                <span className="text-gray-900 font-bold">Child ({guests.children})</span>
                                                <span className="text-gray-400">₹{priceBreakdown.childTicketRate.toLocaleString()} x {guests.children}</span>
                                            </div>
                                            <span className="font-bold text-gray-900">₹{priceBreakdown.totalChildTicket?.toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Total Amount */}
                                <div className="flex justify-between items-center px-1 py-1.5 border-t border-gray-200">
                                    <span className="text-xs font-black text-gray-900">Total Amount</span>
                                    <span className="text-base font-black text-gray-900">₹{priceBreakdown.grantTotal?.toLocaleString()}</span>
                                </div>

                                {/* Pay Now */}
                                <div className="bg-blue-50/80 p-2.5 rounded-lg border border-blue-100 flex justify-between items-center">
                                    <span className="text-xs font-black text-blue-600">Pay Now</span>
                                    <span className="text-lg font-black text-blue-700">₹{priceBreakdown.tokenAmount?.toLocaleString()}</span>
                                </div>

                                {/* Pay at Park */}
                                <div className="flex justify-between items-center px-2 py-2.5 bg-gray-50 rounded-lg border border-gray-100">
                                    <span className="text-xs font-bold text-gray-700">Pay at Park</span>
                                    <span className="text-base font-black text-gray-900">₹{(priceBreakdown.grantTotal - priceBreakdown.tokenAmount).toLocaleString()}</span>
                                </div>

                                {/* You Saved - STYLISH */}
                                {priceBreakdown.totalSavings > 0 && (
                                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-2.5 rounded-lg border-2 border-green-200 flex justify-between items-center shadow-sm">
                                        <span className="text-xs font-black text-green-700 flex items-center gap-1">
                                            <span className="text-base">🎉</span> You Saved
                                        </span>
                                        <span className="text-lg font-black text-green-700">₹{priceBreakdown.totalSavings.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>


            </div>

            {/* Action Button Section */}
            <div className="p-3 pt-1 bg-white rounded-b-3xl">
                <button
                    onClick={handleReserve}
                    className="w-full bg-[#FF385C] hover:bg-[#D9324E] text-white py-2.5 rounded-xl font-bold text-base shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
                >
                    <FaTicketAlt className="text-xs text-white/90 group-hover:rotate-12 transition-transform" />
                    <span>{!dateRange.from ? 'Select Dates' : (priceBreakdown ? `Pay Now ₹${priceBreakdown.tokenAmount?.toLocaleString()}` : 'Check Availability')}</span>
                </button>
                <div className="flex flex-col items-center mt-2">
                    <p className="text-[8px] text-gray-400 flex items-center justify-center gap-1 font-medium">
                        <FaCheck className="text-green-500" size={6} /> Free Cancellation up to 24hrs
                    </p>
                    <div className="text-[7px] text-gray-300 mt-0.5 uppercase tracking-widest font-bold">
                        Instant Confirmation
                    </div>
                </div>
            </div>

        </div>
    );
}
