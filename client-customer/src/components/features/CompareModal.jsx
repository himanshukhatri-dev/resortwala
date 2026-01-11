import React from 'react';
import { useCompare } from '../../context/CompareContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaTimes, FaCheck, FaStar, FaMapMarkerAlt, FaBed, FaBath, FaUserFriends,
    FaSwimmingPool, FaWifi, FaSnowflake, FaParking, FaCamera, FaTree, FaCouch, FaUtensils,
    FaMoneyBillWave, FaTshirt, FaVideo, FaWheelchair, FaMedkit, FaUmbrellaBeach, FaChair,
    FaUserShield, FaConciergeBell, FaHotTub, FaMusic, FaCheckCircle, FaWater, FaClock,
    FaInfoCircle, FaShieldAlt, FaChevronRight
} from 'react-icons/fa';
import {
    MdPool, MdWater, MdOutlineDeck, MdChildCare, MdWaterfallChart, MdSportsEsports,
    MdRestaurant, MdOutlineOutdoorGrill, MdOutlinePolicy
} from 'react-icons/md';
import { getPricing } from '../../utils/pricing';

// PREMIUM ICON MAPPING
const getIcon = (key, color = "text-gray-400") => {
    const icons = {
        big_pools: <FaSwimmingPool className="text-blue-500" />,
        small_pools: <FaSwimmingPool className="text-teal-400" />,
        big_slides: <MdOutlineDeck className="text-orange-500" />,
        wavepool: <MdWater className="text-blue-600" />,
        rain_dance: <MdWaterfallChart className="text-purple-500" />,
        dj_system: <FaMusic className="text-pink-500" />,
        kids_area: <MdChildCare className="text-green-500" />,
        parking: <FaParking className="text-gray-600" />,
        wifi: <FaWifi className="text-blue-400" />,
        ac: <FaSnowflake className="text-sky-400" />,
        kitchen: <FaUtensils className="text-gray-500" />,
        garden: <FaTree className="text-green-600" />,
        cctv: <FaVideo className="text-gray-700" />,
        security: <FaUserShield className="text-blue-900" />,
        restaurant: <MdRestaurant className="text-orange-600" />,
        game_room: <MdSportsEsports className="text-indigo-500" />,
        checkin: <FaClock className="text-emerald-500" />,
        rules: <MdOutlinePolicy className="text-amber-500" />,
        capacity: <FaUserFriends className="text-indigo-400" />,
        rooms: <FaBed className="text-amber-600" />,
        bath: <FaBath className="text-cyan-500" />,
        meal: <FaUtensils className="text-orange-400" />,
        policy: <FaShieldAlt className="text-blue-400" />
    };
    return icons[key] || <FaCheckCircle className={color} size={14} />;
};

const COMPARE_CATEGORIES = [
    {
        title: "Basic Information",
        items: [
            { label: 'Rating', icon: 'rating', render: (p) => <div className="flex items-center gap-1.5 font-bold text-gray-900 bg-yellow-50 px-2 py-0.5 rounded-lg border border-yellow-100"><FaStar className="text-yellow-400" /> {p.Rating || 4.5}</div> },
            { label: 'Location', icon: 'location', render: (p) => <div className="flex items-center gap-1.5 text-gray-600 text-xs font-medium"><FaMapMarkerAlt className="text-gray-400" /> {p.Location || p.CityName || 'India'}</div> },
            { label: 'Description', icon: 'info', render: (p) => <p className="text-[10px] text-gray-500 line-clamp-3 leading-tight">{p.ShortDescription || p.onboarding_data?.shortDescription || "No description available."}</p> },
        ]
    },
    {
        title: "Stay Configuration",
        items: [
            { label: 'Guest Capacity', icon: 'capacity', render: (p) => p.PropertyType === 'Waterpark' ? '-' : <span className="font-bold text-gray-800">{p.MaxCapacity || p.MaxGuests || 0} Guests</span> },
            { label: 'Bedrooms', icon: 'rooms', render: (p) => p.PropertyType === 'Waterpark' ? '-' : <span className="font-bold text-gray-800">{p.NoofRooms || p.Bedrooms || 0} Rooms</span> },
            { label: 'Attached Baths', icon: 'bath', render: (p) => p.PropertyType === 'Waterpark' ? '-' : <span className="font-bold text-gray-800">{(p.onboarding_data?.roomConfig?.bedrooms || p.onboarding_data?.RoomConfig?.bedrooms)?.filter(r => r.bathroom)?.length || p.NoofRooms || 0} Baths</span> },
        ]
    },
    {
        title: "Key Amenities",
        items: [
            { label: 'Swimming Pool', key: 'pool', icon: 'big_pools', check: (p) => (p.onboarding_data?.amenities || p.onboarding_data?.Amenities)?.big_pools || (p.onboarding_data?.amenities || p.onboarding_data?.Amenities)?.small_pools },
            { label: 'Air Conditioning', key: 'ac', icon: 'ac', check: (p) => (p.onboarding_data?.roomConfig?.bedrooms || p.onboarding_data?.RoomConfig?.bedrooms)?.some(r => r.ac) },
            { label: 'Free Wi-Fi', key: 'wifi', icon: 'wifi', check: (p) => (p.onboarding_data?.amenities || p.onboarding_data?.Amenities)?.wifi },
            { label: 'Music System', key: 'dj', icon: 'dj_system', check: (p) => (p.onboarding_data?.amenities || p.onboarding_data?.Amenities)?.dj_system || (p.onboarding_data?.amenities || p.onboarding_data?.Amenities)?.rain_dance },
            { label: 'Parking', key: 'parking', icon: 'parking', check: (p) => (p.onboarding_data?.amenities || p.onboarding_data?.Amenities)?.parking },
            { label: 'Food / Dining', key: 'dining', icon: 'restaurant', check: (p) => (p.onboarding_data?.amenities || p.onboarding_data?.Amenities)?.restaurant || (p.onboarding_data?.amenities || p.onboarding_data?.Amenities)?.dining },
            { label: 'Power Backup', key: 'backup', icon: 'power', check: (p) => (p.onboarding_data?.amenities || p.onboarding_data?.Amenities)?.power_backup },
            { label: 'CCTV Security', key: 'cctv', icon: 'cctv', check: (p) => (p.onboarding_data?.amenities || p.onboarding_data?.Amenities)?.cctv },
        ]
    },
    {
        title: "Policies & Details",
        items: [
            { label: 'Check-in', icon: 'checkin', render: (p) => <span className="font-bold text-gray-700 text-[11px]">{p.onboarding_data?.checkInTime || '11:00 AM'}</span> },
            { label: 'Check-out', icon: 'checkin', render: (p) => <span className="font-bold text-gray-700 text-[11px]">{p.onboarding_data?.checkOutTime || '10:00 AM'}</span> },
            { label: 'Veg Meal', icon: 'meal', check: (p) => p.onboarding_data?.foodRates?.veg || p.onboarding_data?.mealPlans?.breakfast?.vegRate },
            { label: 'Cancellation', icon: 'policy', render: (p) => <span className="text-[10px] text-gray-500 font-medium">Moderate Policy</span> },
            { label: 'Primary Guest', icon: 'rating', render: (p) => <span className="text-[10px] text-gray-500 font-medium whitespace-nowrap">18+ Years Required</span> },
        ]
    }
];

export default function CompareModal() {
    const { compareList, isCompareModalOpen, closeCompareModal, removeFromCompare } = useCompare();

    if (!isCompareModalOpen) return null;

    const isMobile = window.innerWidth < 768;
    const visibleList = isMobile ? compareList.slice(0, 2) : compareList;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-xl flex items-center justify-center p-0 md:p-6"
                onClick={closeCompareModal}
            >
                <div className="absolute top-4 right-4 z-[110]">
                    <button onClick={closeCompareModal} className="w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all border border-white/20">
                        <FaTimes size={24} />
                    </button>
                </div>

                <motion.div
                    initial={{ scale: 0.95, y: 30 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 30 }}
                    className="bg-white md:rounded-[2.5rem] w-full h-full md:max-w-[95vw] md:max-h-[90vh] shadow-2xl overflow-hidden flex flex-col relative"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header Row (Sticky) */}
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <div
                            className="grid divide-x divide-gray-100 min-w-max md:min-w-0"
                            style={{
                                gridTemplateColumns: `180px repeat(${visibleList.length}, minmax(240px, 1fr))`
                            }}
                        >
                            {/* Sticky Sidebar Header */}
                            <div className="sticky left-0 z-30 bg-gray-50/95 backdrop-blur-sm border-r border-gray-200">
                                <div className="h-[280px] p-6 flex flex-col justify-center border-b border-gray-100">
                                    <h2 className="text-2xl font-serif font-black text-gray-900 leading-tight">Compare<br /><span className="text-blue-600">Choices</span></h2>
                                    <p className="text-gray-400 text-[10px] mt-2 font-bold uppercase tracking-wider">{visibleList.length} items analyzed</p>
                                </div>
                                {COMPARE_CATEGORIES.map((cat, idx) => (
                                    <React.Fragment key={idx}>
                                        <div className="h-10 bg-gray-100/80 px-6 flex items-center border-b border-gray-200">
                                            <span className="text-[9px] uppercase tracking-[0.2em] font-black text-gray-400">{cat.title}</span>
                                        </div>
                                        {cat.items.map((item, i) => (
                                            <div key={i} className="h-12 px-6 flex items-center gap-3 border-b border-gray-100 group">
                                                <div className="w-6 h-6 rounded-lg bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    {getIcon(item.icon)}
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-600 truncate">{item.label}</span>
                                            </div>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </div>

                            {/* Property Columns */}
                            {visibleList.map((prop) => {
                                const pricing = getPricing(prop);
                                return (
                                    <div key={prop.id} className="flex flex-col group/col">
                                        {/* Property Sticky Header */}
                                        <div className="h-[280px] p-6 bg-white border-b border-gray-100 transition-colors group-hover/col:bg-blue-50/10 flex flex-col">
                                            <div className="relative h-32 w-full rounded-2xl overflow-hidden mb-4 shadow-md border border-gray-100">
                                                <img
                                                    src={prop.ImageUrl || prop.primary_image?.image_url || prop.images?.[0]?.image_url || "https://placehold.co/600x400"}
                                                    className="w-full h-full object-cover group-hover/col:scale-105 transition duration-700"
                                                    alt={prop.Name}
                                                />
                                                <button
                                                    onClick={() => removeFromCompare(prop.id)}
                                                    className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-rose-500 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all shadow-lg"
                                                >
                                                    <FaTimes size={10} />
                                                </button>
                                                <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider text-gray-900 border border-white/20">
                                                    {prop.PropertyType}
                                                </div>
                                            </div>

                                            <h3 className="font-bold text-sm text-gray-900 line-clamp-1 mb-1">{prop.Name}</h3>

                                            <div className="mt-auto">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {pricing.percentage > 0 && (
                                                        <>
                                                            <span className="text-[10px] text-gray-400 line-through">₹{Math.round(pricing.marketPrice).toLocaleString()}</span>
                                                            <span className="text-[9px] font-bold text-green-600 bg-green-50 px-1 py-0.5 rounded uppercase tracking-tighter border border-green-100">Save {pricing.percentage}%</span>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="flex items-baseline gap-1 mb-3">
                                                    <span className="text-xl font-black text-gray-900">₹{pricing.sellingPrice.toLocaleString()}</span>
                                                    <span className="text-[9px] text-gray-400 font-medium">/ {prop.PropertyType === 'Waterpark' ? 'person' : 'night'}</span>
                                                </div>
                                                <button
                                                    onClick={() => window.open(`/property/${prop.id}`, '_blank')}
                                                    className="w-full py-2 bg-black text-white rounded-xl font-bold text-[11px] hover:bg-blue-600 transition-all flex items-center justify-center gap-2 group/btn shadow-lg"
                                                >
                                                    View Details <FaChevronRight size={8} className="group-hover/btn:translate-x-1 transition-transform" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Comparison Tiers */}
                                        {COMPARE_CATEGORIES.map((cat, idx) => (
                                            <React.Fragment key={idx}>
                                                <div className="h-10 bg-gray-50/50 border-b border-gray-100"></div>
                                                {cat.items.map((item, i) => {
                                                    const value = item.render ? item.render(prop) : null;
                                                    const isChecked = item.check ? item.check(prop) : false;

                                                    return (
                                                        <div key={i} className="h-12 px-6 flex items-center border-b border-gray-50 group-hover/col:bg-blue-50/5 transition-colors">
                                                            {item.render ? (
                                                                <div className="w-full text-[10px]">{value}</div>
                                                            ) : (
                                                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-bold transition-all ${isChecked ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-gray-50 text-gray-300 opacity-60'}`}>
                                                                    {isChecked ? (
                                                                        <><FaCheck size={10} className="text-green-500" /> Yes</>
                                                                    ) : (
                                                                        <><FaTimes size={8} className="text-gray-300" /> No</>
                                                                    )}
                                                                </div>
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
            </motion.div>
        </AnimatePresence>
    );
}

