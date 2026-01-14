import React from 'react';
import { useCompare } from '../../context/CompareContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaTimes, FaCheck, FaStar, FaMapMarkerAlt, FaBed, FaBath, FaUserFriends,
    FaSwimmingPool, FaWifi, FaSnowflake, FaParking, FaCamera, FaTree, FaCouch, FaUtensils,
    FaMoneyBillWave, FaTshirt, FaVideo, FaWheelchair, FaMedkit, FaUmbrellaBeach, FaChair,
    FaUserShield, FaConciergeBell, FaHotTub, FaMusic, FaCheckCircle, FaWater, FaClock,
    FaInfoCircle, FaShieldAlt, FaChevronRight, FaTimesCircle
} from 'react-icons/fa';
import {
    MdPool, MdWater, MdOutlineDeck, MdChildCare, MdWaterfallChart, MdSportsEsports,
    MdRestaurant, MdOutlineOutdoorGrill, MdOutlinePolicy, MdFamilyRestroom
} from 'react-icons/md';
import { getPricing } from '../../utils/pricing';

// PREMIUM ICON MAPPING
const getIcon = (key, color = "text-gray-400") => {
    const icons = {
        rating: <FaStar className="text-yellow-400" />,
        location: <FaMapMarkerAlt className="text-red-400" />,
        capacity: <FaUserFriends className="text-indigo-500" />,
        rooms: <FaBed className="text-blue-500" />,
        bath: <FaBath className="text-cyan-500" />,
        pool: <FaSwimmingPool className="text-blue-500" />,
        ac: <FaSnowflake className="text-sky-400" />,
        wifi: <FaWifi className="text-blue-400" />,
        music: <FaMusic className="text-pink-500" />,
        food: <MdRestaurant className="text-orange-500" />,
        parking: <FaParking className="text-gray-600" />,
        safety: <FaUserShield className="text-green-600" />,
        checkin: <FaClock className="text-gray-500" />,
        policy: <MdOutlinePolicy className="text-amber-500" />
    };
    return icons[key] || <FaCheckCircle className={color} size={14} />;
};

const COMPARE_CATEGORIES = [
    {
        title: "Overview",
        items: [
            { id: 'rating', label: 'Rating', icon: 'rating', render: (p) => <div className="flex items-center gap-1 font-bold text-gray-900"><FaStar className="text-yellow-400" /> {p?.Rating || 4.5}</div> },
            { id: 'loc', label: 'Location', icon: 'location', render: (p) => <span className="text-xs font-medium text-gray-600">{p?.Location || p?.CityName || 'India'}</span> },
            { id: 'desc', label: 'About', icon: 'info', render: (p) => <p className="text-[10px] text-gray-500 line-clamp-2 leading-tight">{p?.ShortDescription || "No description."}</p> },
        ]
    },
    {
        title: "Stay Details",
        items: [
            { id: 'cap', label: 'Max Guests', icon: 'capacity', render: (p) => <span className="font-bold text-gray-800">{p?.MaxCapacity || p?.MaxGuests || 0} Guests</span> },
            { id: 'rms', label: 'Bedrooms', icon: 'rooms', render: (p) => <span className="font-bold text-gray-800">{p?.NoofRooms || p?.Bedrooms || 0} Rooms</span> },
            {
                id: 'bath',
                label: 'Bathrooms',
                icon: 'bath',
                render: (p) => <span className="font-bold text-gray-800">
                    {(p?.onboarding_data?.roomConfig?.bedrooms || [])?.filter(r => r?.bathroom)?.length || p?.NoofRooms || 0} Baths
                </span>
            },
            {
                id: 'mattress',
                label: 'Extra Bedding',
                icon: 'bed',
                render: (p) => p?.onboarding_data?.extraMattress?.available ? <span className="text-green-600 text-[10px] font-bold">Yes (Chargeable)</span> : <span className="text-gray-400 text-[10px]">No</span>
            }
        ]
    },
    {
        title: "Amenities & Fun",
        items: [
            {
                id: 'pool',
                label: 'Swimming Pool',
                icon: 'pool',
                render: (p) => {
                    const am = p?.onboarding_data?.amenities || {};
                    if (am?.big_pools) return <span className="text-blue-600 font-bold text-[10px]">Big Pool Available</span>;
                    if (am?.small_pools) return <span className="text-teal-600 font-bold text-[10px]">Small Pool</span>;
                    return <span className="text-gray-400 text-[10px]">No Pool</span>;
                }
            },
            {
                id: 'music',
                label: 'Music / DJ',
                icon: 'music',
                render: (p) => {
                    const am = p?.onboarding_data?.amenities || {};
                    if (am?.dj_system) return <span className="text-pink-600 font-bold text-[10px]">DJ System</span>;
                    if (am?.music_system) return <span className="text-purple-600 font-bold text-[10px]">Speaker System</span>;
                    return <span className="text-gray-400 text-[10px]">-</span>;
                }
            },
            { id: 'ac', label: 'AC Rooms', icon: 'ac', check: (p) => (p?.onboarding_data?.roomConfig?.bedrooms || [])?.some(r => r?.ac) },
            { id: 'wifi', label: 'Free Wi-Fi', icon: 'wifi', check: (p) => (p?.onboarding_data?.amenities || {})?.wifi },
            { id: 'food', label: 'In-house Food', icon: 'food', check: (p) => (p?.onboarding_data?.amenities || {})?.restaurant || (p?.onboarding_data?.amenities || {})?.dining },
            { id: 'safety', label: 'CCTV / Security', icon: 'safety', check: (p) => (p?.onboarding_data?.amenities || {})?.cctv || (p?.onboarding_data?.amenities || {})?.security },
        ]
    },
    {
        title: "Policies",
        items: [
            { id: 'in', label: 'Check-in', icon: 'checkin', render: (p) => <span className="font-bold text-gray-700 text-[10px]">{p?.onboarding_data?.checkInTime || '11:00 AM'}</span> },
            { id: 'out', label: 'Check-out', icon: 'checkin', render: (p) => <span className="font-bold text-gray-700 text-[10px]">{p?.onboarding_data?.checkOutTime || '10:00 AM'}</span> },
            {
                id: 'food_pol',
                label: 'Meal Types',
                icon: 'food',
                render: (p) => {
                    const fr = p?.onboarding_data?.foodRates || {};
                    const types = [];
                    if (fr?.veg) types.push('Veg');
                    if (fr?.non_veg) types.push('Non-Veg');
                    return types.length ? <span className="text-[10px] font-medium">{types.join(', ')}</span> : <span className="text-gray-400 text-[10px]">-</span>;
                }
            },
        ]
    }
];

export default function CompareModal() {
    const { compareList, isCompareModalOpen, closeCompareModal, removeFromCompare } = useCompare();

    if (!isCompareModalOpen) return null;

    const isMobile = window.innerWidth < 768;
    const visibleList = isMobile ? compareList : compareList;

    // Mobile View: Feature-First Blocks
    const MobileView = () => (
        <div className="flex flex-col h-full bg-gray-50 overflow-y-auto pb-20">
            {/* Header */}
            <div className="bg-white p-6 sticky top-0 z-20 border-b border-gray-200 shadow-sm flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-gray-900">Compare</h2>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{compareList.length} properties</p>
                </div>
                <button onClick={closeCompareModal} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                    <FaTimes />
                </button>
            </div>

            {/* Properties Header Row (Horizontal Scroll) */}
            <div className="flex overflow-x-auto p-4 gap-4 bg-white border-b border-gray-200 sticky top-[89px] z-10 no-scrollbar">
                {visibleList.map((prop, idx) => {
                    const pricing = getPricing(prop);
                    return (
                        <div key={prop.id} className="min-w-[160px] w-[160px] flex-shrink-0 relative">
                            <button
                                onClick={() => removeFromCompare(prop.id)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 z-10 shadow-md"
                            >
                                <FaTimes size={10} />
                            </button>
                            <div className="h-24 rounded-lg overflow-hidden mb-2 border border-gray-100">
                                <img src={prop.ImageUrl} className="w-full h-full object-cover" alt="" />
                            </div>
                            <h3 className="text-xs font-bold text-gray-900 truncate mb-1">{prop.Name}</h3>
                            <div className="text-sm font-black text-blue-600">₹{pricing.sellingPrice.toLocaleString()}</div>
                        </div>
                    );
                })}
                {/* Add Placeholder if less than 2 */}
                {visibleList.length < 2 && (
                    <div className="min-w-[160px] h-[160px] flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-xs font-bold bg-gray-50">
                        Add more to compare
                    </div>
                )}
            </div>

            {/* Comparison Blocks */}
            <div className="p-4 space-y-6">
                {COMPARE_CATEGORIES.map((cat, catIdx) => (
                    <div key={catIdx} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">{cat.title}</h4>
                        <div className="space-y-4">
                            {cat.items.map((item, itemIdx) => (
                                <div key={itemIdx}>
                                    <div className="flex items-center gap-2 mb-2 text-gray-500 text-xs font-bold">
                                        {getIcon(item.icon, "text-gray-400")} <span>{item.label}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {visibleList.map((prop) => {
                                            const value = item.render ? item.render(prop) : null;
                                            const isChecked = item.check ? item.check(prop) : false;
                                            return (
                                                <div key={prop.id} className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs text-gray-800 font-medium">
                                                    {item.render ? value : (
                                                        isChecked ? <span className="flex items-center gap-1 text-green-700 font-bold"><FaCheckCircle className="text-green-500" /> Yes</span>
                                                            : <span className="flex items-center gap-1 text-gray-400"><FaTimesCircle /> No</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="h-12"></div>
        </div>
    );

    // Desktop View: Grid
    const DesktopView = () => (
        <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-[2.5rem] w-full max-w-[95vw] h-[90vh] shadow-2xl overflow-hidden flex flex-col relative"
            onClick={e => e.stopPropagation()}
        >
            <div className="absolute top-6 right-6 z-[110]">
                <button onClick={closeCompareModal} className="w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full flex items-center justify-center transition-all">
                    <FaTimes size={18} />
                </button>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
                <div
                    className="grid divide-x divide-gray-100 min-w-0"
                    style={{
                        gridTemplateColumns: `200px repeat(${visibleList.length}, minmax(280px, 1fr))`
                    }}
                >
                    {/* Headers + Sidebar */}
                    <div className="sticky left-0 z-30 bg-gray-50/95 backdrop-blur-sm border-r border-gray-200">
                        <div className="h-[320px] p-8 flex flex-col justify-center border-b border-gray-100">
                            <h2 className="text-3xl font-serif font-black text-gray-900 leading-none mb-2">Compare<br /><span className="text-blue-600">Stays</span></h2>
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{visibleList.length} properties selected</p>
                        </div>
                        {COMPARE_CATEGORIES.map((cat, idx) => (
                            <React.Fragment key={idx}>
                                <div className="h-12 bg-gray-100/80 px-8 flex items-center border-b border-gray-200">
                                    <span className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-500">{cat.title}</span>
                                </div>
                                {cat.items.map((item, i) => (
                                    <div key={i} className="h-16 px-8 flex items-center gap-3 border-b border-gray-100 group">
                                        <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-lg">
                                            {getIcon(item.icon)}
                                        </div>
                                        <span className="text-xs font-bold text-gray-600 truncate">{item.label}</span>
                                    </div>
                                ))}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Property Columns */}
                    {visibleList.map((prop) => {
                        const pricing = getPricing(prop);
                        return (
                            <div key={prop.id} className="flex flex-col group/col hover:bg-slate-50/50 transition-colors">
                                {/* Header */}
                                <div className="h-[320px] p-8 bg-white border-b border-gray-100 flex flex-col items-center text-center">
                                    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden mb-6 shadow-lg group-hover/col:shadow-xl transition-all">
                                        <img
                                            src={prop.ImageUrl}
                                            className="w-full h-full object-cover group-hover/col:scale-110 transition duration-700"
                                            alt={prop.Name}
                                        />
                                        <button
                                            onClick={() => removeFromCompare(prop.id)}
                                            className="absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-red-500 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all"
                                        >
                                            <FaTimes size={12} />
                                        </button>
                                    </div>
                                    <h3 className="font-bold text-xl text-gray-900 leading-tight mb-2 line-clamp-2">{prop.Name}</h3>
                                    <div className="flex items-baseline gap-1 mb-4">
                                        <span className="text-2xl font-black text-gray-900">₹{pricing.sellingPrice.toLocaleString()}</span>
                                        <span className="text-xs text-gray-500 font-bold">/ night</span>
                                    </div>
                                    <button
                                        onClick={() => window.open(`/property/${prop.id}`, '_blank')}
                                        className="w-full py-3 bg-black text-white rounded-xl font-bold text-xs hover:bg-blue-600 transition-all flex items-center justify-center gap-2 group/btn shadow-lg"
                                    >
                                        View Property <FaChevronRight size={10} className="group-hover/btn:translate-x-1 transition-transform" />
                                    </button>
                                </div>

                                {/* Comparison Cells */}
                                {COMPARE_CATEGORIES.map((cat, idx) => (
                                    <React.Fragment key={idx}>
                                        <div className="h-12 bg-transparent border-b border-gray-100"></div>
                                        {cat.items.map((item, i) => {
                                            const value = item.render ? item.render(prop) : null;
                                            const isChecked = item.check ? item.check(prop) : false;
                                            return (
                                                <div key={i} className="h-16 px-8 flex items-center justify-center border-b border-gray-100">
                                                    {item.render ? (
                                                        <div className="text-sm">{value}</div>
                                                    ) : (
                                                        isChecked ?
                                                            <FaCheckCircle className="text-green-500 text-xl" /> :
                                                            <span className="w-2 h-2 rounded-full bg-gray-200"></span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </React.Fragment>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-0 md:p-6" onClick={closeCompareModal}>
                {isMobile ? <MobileView /> : <DesktopView />}
            </div>
        </AnimatePresence>
    );
}
