import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompare } from '../../context/CompareContext';
import { FaTimes, FaCheckCircle, FaTimesCircle, FaBed, FaBath, FaUsers, FaParking, FaSwimmingPool, FaWifi, FaSnowflake, FaTv, FaUtensils, FaDog, FaMusic, FaGlassCheers, FaRupeeSign, FaTrash, FaHome, FaMapMarkerAlt } from 'react-icons/fa';

// Helper to get nested property safely
const get = (obj, path, def = null) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj) || def;
};

const SECTIONS = [
    {
        title: "Basic Info",
        items: [
            { label: "Property Type", render: p => p.PropertyType || 'Villa' },
            { label: "Max Guests", icon: <FaUsers />, render: p => p.MaxCapacity || '-' },
            { label: "Bedrooms", icon: <FaBed />, render: p => p.NoofRooms || '-' },
            { label: "Bathrooms", icon: <FaBath />, render: p => p.NoofBathRooms || '-' },
            { label: "Parking", icon: <FaParking />, render: p => (p.onboarding_data?.amenities?.parking || p.onboarding_data?.amenities?.FreeParking || p.Breakfast === 'Yes') ? <FaCheckCircle className="text-green-500" /> : <FaTimesCircle className="text-gray-200" /> }
        ]
    },
    {
        title: "Amenities",
        items: [
            { label: "Swimming Pool", icon: <FaSwimmingPool />, checkKeys: ['onboarding_data.amenities.pool', 'onboarding_data.amenities.big_pools'] },
            { label: "Free Wi-Fi", icon: <FaWifi />, checkKeys: ['onboarding_data.amenities.wifi', 'onboarding_data.amenities.FreeWi-Fi'] },
            { label: "AC", icon: <FaSnowflake />, checkKeys: ['onboarding_data.amenities.ac', 'onboarding_data.amenities.AC'] },
            { label: "TV", icon: <FaTv />, checkKeys: ['onboarding_data.amenities.tv', 'onboarding_data.amenities.TV'] },
            { label: "Kitchen", icon: <FaUtensils />, checkKeys: ['onboarding_data.amenities.kitchen', 'onboarding_data.amenities.KitchenAccess'] },
            { label: "Caretaker", icon: <FaUsers />, render: p => (get(p, 'onboarding_data.amenities.caretaker') || get(p, 'onboarding_data.amenities.SecurityGuard')) ? <FaCheckCircle className="text-green-500" /> : <FaTimesCircle className="text-gray-300" /> },
        ]
    },
    {
        title: "Policies",
        items: [
            { label: "Pets Allowed", icon: <FaDog />, checkKeys: ['onboarding_data.policies.pets_allowed', 'onboarding_data.rules.2'] },
            { label: "Alcohol Allowed", icon: <FaGlassCheers />, checkKeys: ['onboarding_data.policies.alcohol_allowed', 'onboarding_data.rules.7'] },
            { label: "Loud Music", icon: <FaMusic />, render: p => (get(p, 'onboarding_data.policies.loud_music_allowed') || get(p, 'onboarding_data.rules.6')) ? "Allowed" : "Restricted" }
        ]
    },
    {
        title: "Pricing",
        items: [
            { label: "Weekday Price", icon: <FaRupeeSign />, render: p => `₹${(p.price_mon_thu || p.Price || 0).toLocaleString()}` },
            { label: "Weekend Price", icon: <FaRupeeSign />, render: p => `₹${(p.price_fri_sun || p.price_sat || p.Price || 0).toLocaleString()}` },
            { label: "Security Deposit", icon: <FaRupeeSign />, render: p => `₹${(get(p, 'onboarding_data.pricing.security_deposit') || 0).toLocaleString()}` },
        ]
    }
];


export default function CompareModal({ isOpen, onClose }) {
    const { compareList, removeFromCompare, clearCompare, setCompareList } = useCompare();
    const [freshData, setFreshData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch fresh data when modal opens
    React.useEffect(() => {
        if (isOpen && compareList.length > 0) {
            const fetchFresh = async () => {
                setLoading(true);
                try {
                    const promises = compareList.map(p =>
                        axios.get(`${API_BASE_URL}/properties/${p.id || p.PropertyId}`)
                    );
                    const results = await Promise.all(promises);
                    const updatedList = results.map(r => r.data);
                    setFreshData(updatedList);
                } catch (err) {
                    console.error("Failed to fetch fresh compare data", err);
                    // Fallback to existing data if fetch fails
                    setFreshData(compareList);
                } finally {
                    setLoading(false);
                }
            };
            fetchFresh();
        }
    }, [isOpen]); // Only trigger when modal opens

    // Body Scroll Lock
    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            return () => { document.body.style.overflow = ''; };
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const activeData = freshData.length > 0 ? freshData : compareList;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 pointer-events-none"
                    >
                        <div className="bg-white w-full max-w-6xl h-[85vh] rounded-3xl shadow-2xl flex flex-col pointer-events-auto overflow-hidden">

                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white z-10">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 font-serif">Compare Stays</h2>
                                    <p className="text-gray-500 text-sm">{compareList.length} properties selected</p>
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={clearCompare} className="text-red-500 font-bold text-sm hover:underline">Clear All</button>
                                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition">
                                        <FaTimes />
                                    </button>
                                </div>
                            </div>

                            {/* Content - Scrollable */}
                            <div className="flex-1 overflow-auto custom-scrollbar bg-gray-50/50">
                                {compareList.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                            <FaHome className="text-gray-300 text-3xl" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-800">No properties to compare</h3>
                                        <p className="text-gray-500 mt-2">Add properties from the list to see them here.</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* --- DESKTOP VIEW (Table) --- */}
                                        <div className="hidden md:block min-w-max p-6">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr>
                                                        <th className="p-4 w-48 sticky left-0 bg-white z-30 border-b-2 border-transparent shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                                            {/* Empty corner */}
                                                        </th>
                                                        {activeData.map(prop => (
                                                            <th key={prop.id} className="p-4 w-72 align-top border-b border-gray-100 min-w-[280px]">
                                                                <div className="relative group">
                                                                    <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-3 shadow-md">
                                                                        <img
                                                                            src={prop.primary_image?.image_url || prop.image_url || prop.images?.[0]?.image_url || prop.images?.[0] || 'https://via.placeholder.com/400x300'}
                                                                            alt={prop.Name}
                                                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                                        />
                                                                    </div>
                                                                    <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">{prop.Name}</h3>
                                                                    <p className="text-sm text-gray-500 flex items-center gap-1">
                                                                        <FaMapMarkerAlt className="text-[#EAB308]" /> {prop.Location || prop.detailed_address?.city || prop.City}
                                                                    </p>
                                                                    <button
                                                                        onClick={() => removeFromCompare(prop.id)}
                                                                        className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:scale-110"
                                                                    >
                                                                        <FaTrash size={12} />
                                                                    </button>
                                                                </div>
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {SECTIONS.map((section, idx) => (
                                                        <React.Fragment key={idx}>
                                                            <tr>
                                                                <td colSpan={compareList.length + 1} className="p-4 pt-8 sticky left-0 bg-white z-10">
                                                                    <h4 className="flex items-center gap-2 text-sm font-black text-gray-400 uppercase tracking-widest pl-2 border-l-4 border-[#EAB308]">
                                                                        {section.title}
                                                                    </h4>
                                                                </td>
                                                            </tr>
                                                            {section.items.map((item, itemIdx) => (
                                                                <tr key={itemIdx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                                                    <td className="p-4 text-sm font-bold text-gray-600 sticky left-0 bg-white/95 backdrop-blur z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-gray-400">{item.icon}</span>
                                                                            {item.label}
                                                                        </div>
                                                                    </td>
                                                                    {compareList.map(prop => {
                                                                        let content = null;
                                                                        if (item.render) {
                                                                            content = item.render(prop);
                                                                        } else if (item.checkKeys) {
                                                                            const val = item.checkKeys.some(k => get(prop, k));
                                                                            content = val
                                                                                ? <div className="flex items-center gap-1 text-green-700 font-bold bg-green-50 px-2 py-1 rounded-md w-fit text-xs"><FaCheckCircle className="text-green-500" /> Yes</div>
                                                                                : <div className="flex items-center gap-1 text-gray-400 text-xs"><FaTimesCircle /> No</div>;
                                                                        }
                                                                        return (
                                                                            <td key={prop.id} className="p-4 text-sm font-medium text-gray-800">
                                                                                {content}
                                                                            </td>
                                                                        );
                                                                    })}
                                                                </tr>
                                                            ))}
                                                        </React.Fragment>
                                                    ))}
                                                    {/* Action Row */}
                                                    <tr>
                                                        <td className="p-4 sticky left-0 bg-white"></td>
                                                        {activeData.map(prop => (
                                                            <td key={prop.id} className="p-4">
                                                                <button className="w-full bg-black text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition shadow-lg active:scale-95">
                                                                    View Details
                                                                </button>
                                                            </td>
                                                        ))}
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* --- MOBILE VIEW (Pointwise Blocks) --- */}
                                        {/* --- MOBILE VIEW: Matrix Table Style (Zigwheels) --- */}
                                        <div className="md:hidden flex-1 overflow-auto relative custom-scrollbar bg-white">
                                            <table className="w-max border-collapse relative">
                                                <thead>
                                                    <tr>
                                                        {/* Sticky Top-Left Corner */}
                                                        <th className="sticky top-0 left-0 z-40 bg-white border-b border-r border-gray-100 p-2 min-w-[100px] w-[100px] align-bottom shadow-[2px_2px_5px_rgba(0,0,0,0.05)]">
                                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Features</span>
                                                        </th>
                                                        {/* Sticky Top Headers (Properties) */}
                                                        {activeData.map(prop => (
                                                            <th key={prop.id} className="sticky top-0 z-30 bg-white border-b border-gray-100 p-1.5 min-w-[120px] w-[120px] shadow-[0_2px_5px_rgba(0,0,0,0.05)] align-bottom">
                                                                <div className="relative">
                                                                    <div className="h-16 w-full rounded-lg overflow-hidden mb-1.5 border border-gray-100 bg-gray-50">
                                                                        <img
                                                                            src={prop.primary_image?.image_url || prop.image_url || 'https://via.placeholder.com/150'}
                                                                            className="w-full h-full object-cover"
                                                                            alt={prop.Name}
                                                                        />
                                                                    </div>
                                                                    <div className="h-8 flex items-center justify-center">
                                                                        <p className="text-[10px] font-bold text-gray-900 leading-tight line-clamp-2 text-center">{prop.Name}</p>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => removeFromCompare(prop.id)}
                                                                        className="absolute -top-1 -right-1 bg-white text-gray-400 rounded-full p-1 shadow-sm border border-gray-100 hover:text-red-500 z-50"
                                                                    >
                                                                        <FaTimes size={10} />
                                                                    </button>
                                                                </div>
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {SECTIONS.map((section, idx) => (
                                                        <React.Fragment key={idx}>
                                                            {/* Section Header */}
                                                            <tr className="bg-gray-50/50">
                                                                <td className="sticky left-0 z-20 bg-gray-50 border-y border-r border-gray-100 p-1.5 px-2 font-bold text-[10px] text-gray-500 uppercase tracking-wider text-left">
                                                                    {section.title}
                                                                </td>
                                                                <td colSpan={compareList.length} className="border-y border-gray-100 bg-gray-50"></td>
                                                            </tr>
                                                            {/* Feature Rows */}
                                                            {section.items.map((item, i) => (
                                                                <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/30 transition-colors">
                                                                    {/* Sticky Left Label */}
                                                                    <td className="sticky left-0 z-20 bg-white border-r border-gray-50 p-2 text-[10px] font-bold text-gray-600 align-middle shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                                                        <div className="flex items-center gap-1">
                                                                            {item.icon && <span className="text-[#EAB308] opacity-80">{item.icon}</span>}
                                                                            {item.label}
                                                                        </div>
                                                                    </td>
                                                                    {/* Property Values */}
                                                                    {compareList.map(prop => {
                                                                        let content = null;
                                                                        if (item.render) {
                                                                            content = item.render(prop);
                                                                        } else if (item.checkKeys) {
                                                                            const val = item.checkKeys.some(k => get(prop, k));
                                                                            content = val
                                                                                ? <FaCheckCircle className="text-green-500 mx-auto" size={12} />
                                                                                : <FaTimesCircle className="text-gray-200 mx-auto" size={12} />;
                                                                        }
                                                                        return (
                                                                            <td key={prop.id} className="p-2 text-center text-[10px] text-gray-800 font-medium min-w-[120px]">
                                                                                {content}
                                                                            </td>
                                                                        );
                                                                    })}
                                                                </tr>
                                                            ))}
                                                        </React.Fragment>
                                                    ))}
                                                    {/* CTA Row */}
                                                    <tr className="bg-white">
                                                        <td className="sticky left-0 z-20 bg-white border-r border-t border-gray-100 p-2"></td>
                                                        {compareList.map(prop => (
                                                            <td key={prop.id} className="p-2 border-t border-gray-100">
                                                                <button className="w-full bg-black text-white text-[10px] font-bold py-2 rounded-lg shadow-sm active:scale-95 transition-transform">
                                                                    View
                                                                </button>
                                                            </td>
                                                        ))}
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
