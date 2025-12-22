import React from 'react';
import { useCompare } from '../../context/CompareContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaCheck, FaTimes as FaCross, FaStar, FaMapMarkerAlt, FaBed, FaBath, FaUserFriends, FaSwimmingPool, FaWifi, FaSnowflake } from 'react-icons/fa';

export default function CompareModal() {
    const { compareList, isCompareModalOpen, closeCompareModal, removeFromCompare } = useCompare();

    if (!isCompareModalOpen) return null;

    // Feature list for comparison
    const features = [
        { label: 'Rating', key: 'rating', render: (val) => <span className="flex items-center gap-1 font-bold text-gray-900"><FaStar className="text-yellow-400" /> {val || 'N/A'}</span> },
        { label: 'Location', key: 'location', render: (val) => <span className="flex items-center gap-1 text-gray-600"><FaMapMarkerAlt className="text-gray-400" /> {val || 'Unknown'}</span> },
        { label: 'Price / Night', key: 'price', render: (val) => <span className="font-bold text-xl text-black">₹{Number(val).toLocaleString()}</span> },
        { label: 'Capacity', key: 'capacity', render: (val) => <span className="flex items-center gap-2"><FaUserFriends className="text-gray-400" /> {val || 0} Guests</span> },
        { label: 'Bedrooms', key: 'bedrooms', render: (val) => <span className="flex items-center gap-2"><FaBed className="text-gray-400" /> {val || 0}</span> },
        { label: 'Bathrooms', key: 'bathrooms', render: (val) => <span className="flex items-center gap-2"><FaBath className="text-gray-400" /> {val || 0}</span> },
    ];

    const amenitiesList = ['Pool', 'WiFi', 'AC', 'Parking', 'Kitchen', 'TV'];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 md:p-10"
                onClick={closeCompareModal}
            >
                <motion.div
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 20 }}
                    className="bg-white rounded-3xl w-full max-w-7xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div>
                            <h2 className="text-2xl font-serif font-bold text-gray-900">Compare Properties</h2>
                            <p className="text-gray-500 text-sm">Comparing {compareList.length} properties side by side</p>
                        </div>
                        <button onClick={closeCompareModal} className="p-2 hover:bg-gray-100 rounded-full transition"><FaTimes size={24} className="text-gray-400 hover:text-gray-900" /></button>
                    </div>

                    {/* Content Scrollable */}
                    <div className="overflow-auto flex-1 p-6 custom-scrollbar">
                        <div className="grid gap-8" style={{ gridTemplateColumns: `200px repeat(${compareList.length}, minmax(280px, 1fr))` }}>

                            {/* Labels Column */}
                            <div className="flex flex-col gap-4 pt-[300px]">
                                {features.map((f, i) => (
                                    <div key={i} className="h-12 flex items-center font-bold text-gray-500 text-sm uppercase tracking-wider">{f.label}</div>
                                ))}
                                <div className="mt-8 font-black text-lg text-gray-900">Amenities</div>
                                {amenitiesList.map((am, i) => (
                                    <div key={`am-lbl-${i}`} className="h-10 flex items-center font-medium text-gray-500">{am}</div>
                                ))}
                            </div>

                            {/* Property Columns */}
                            {compareList.map((prop) => (
                                <div key={prop.id} className="flex flex-col gap-4 relative">
                                    {/* Action Header */}
                                    <div className="absolute -top-2 right-0">
                                        <button onClick={() => removeFromCompare(prop.id)} className="text-gray-400 hover:text-red-500 p-1"><FaTimes /></button>
                                    </div>

                                    {/* Image Card */}
                                    <div className="h-[280px] flex flex-col gap-3 rounded-2xl p-2 bg-gray-50 border border-gray-100 hover:shadow-lg transition-all mb-4 group">
                                        <div className="h-[180px] w-full rounded-xl overflow-hidden relative">
                                            <img src={prop.image} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" alt={prop.name} />
                                            <div className="absolute top-2 left-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{prop.type}</div>
                                        </div>
                                        <h3 className="font-bold text-lg text-gray-900 leading-tight line-clamp-2">{prop.name}</h3>
                                        <div className="mt-auto">
                                            <button
                                                onClick={() => window.open(`/property/${prop.id}`, '_blank')}
                                                className="w-full py-2 bg-black text-white rounded-lg font-bold text-sm hover:bg-gray-800 transition"
                                            >
                                                View Details
                                            </button>
                                        </div>
                                    </div>

                                    {/* Features Data */}
                                    {features.map((f, i) => (
                                        <div key={i} className="h-12 flex items-center border-b border-gray-50">
                                            {f.render(prop[f.key])}
                                        </div>
                                    ))}

                                    {/* Amenities Data */}
                                    <div className="mt-8"></div>
                                    {amenitiesList.map((am, i) => {
                                        // Check fuzzy match in full amenities list or text
                                        // Since we stored normalized amenities, assumes object or text check
                                        const hasIt = JSON.stringify(prop.amenities).toLowerCase().includes(am.toLowerCase()) || JSON.stringify(prop.originalData).toLowerCase().includes(am.toLowerCase());
                                        return (
                                            <div key={`am-data-${i}`} className="h-10 flex items-center border-b border-gray-50">
                                                {hasIt
                                                    ? <div className="text-green-500 bg-green-50 px-3 py-1 rounded-full text-xs font-bold flex gap-1 items-center"><FaCheck /> Included</div>
                                                    : <div className="text-gray-300 px-3 text-xs font-bold"><FaCross className="inline mr-1" /> - </div>
                                                }
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}

                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
