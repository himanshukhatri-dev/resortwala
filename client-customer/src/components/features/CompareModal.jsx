import React from 'react';
import { useCompare } from '../../context/CompareContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaCheck, FaTimes as FaCross, FaStar, FaMapMarkerAlt, FaBed, FaBath, FaUserFriends, FaSwimmingPool, FaWifi, FaSnowflake } from 'react-icons/fa';

export default function CompareModal() {
    const { compareList, isCompareModalOpen, closeCompareModal, removeFromCompare } = useCompare();

    if (!isCompareModalOpen) return null;

    // Feature list for comparison
    const features = [
        { label: 'Rating', render: (p) => <span className="flex items-center gap-1 font-bold text-gray-900"><FaStar className="text-yellow-400" /> {p.Rating || 4.5}</span> },
        { label: 'Location', render: (p) => <span className="flex items-center gap-1 text-gray-600 text-sm"><FaMapMarkerAlt className="text-gray-400" /> <span className="truncate max-w-[150px]">{p.Location || p.CityName || 'Unknown'}</span></span> },
        { label: 'Price / Night', render: (p) => <span className="font-bold text-xl text-black">₹{Number(p.Price || p.PricePerNight || p.ResortWalaRate || 0).toLocaleString()}</span> },
        {
            label: 'Capacity',
            render: (p) => p.PropertyType === 'Waterpark' ? <span className="text-gray-400">-</span> : <span className="flex items-center gap-2"><FaUserFriends className="text-gray-400" /> {p.MaxCapacity || p.MaxGuests || 0} Guests</span>
        },
        {
            label: 'Bedrooms',
            render: (p) => p.PropertyType === 'Waterpark' ? <span className="text-gray-400">-</span> : <span className="flex items-center gap-2"><FaBed className="text-gray-400" /> {p.NoofRooms || p.Bedrooms || 0}</span>
        },
        {
            label: 'Bathrooms',
            render: (p) => p.PropertyType === 'Waterpark' ? <span className="text-gray-400">-</span> : <span className="flex items-center gap-2"><FaBath className="text-gray-400" /> {
                p.onboarding_data?.roomConfig?.bedrooms?.filter(r => r.bathroom)?.length || p.NoofRooms || 0
            }</span>
        },
    ];

    const amenitiesMap = [
        { label: 'Pool', keys: ['big_pools', 'small_pools'] },
        { label: 'WiFi', keys: ['wifi'] },
        { label: 'AC', check: (p) => p.onboarding_data?.roomConfig?.bedrooms?.some(r => r.ac) },
        { label: 'Parking', keys: ['parking'] },
        { label: 'Kitchen', keys: ['kitchen'] },
        { label: 'TV', check: (p) => p.onboarding_data?.roomConfig?.bedrooms?.some(r => r.tv) }
    ];

    const isMobile = window.innerWidth < 768; // Simple check, or use CSS media queries in grid
    const visibleList = isMobile ? compareList.slice(0, 2) : compareList;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-0 md:p-10"
                onClick={closeCompareModal}
            >
                <motion.div
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 20 }}
                    className="bg-gray-50 md:rounded-3xl w-full h-full md:h-auto md:max-w-7xl md:max-h-[90vh] shadow-2xl overflow-hidden flex flex-col border-none md:border border-gray-200"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-3 md:p-6 border-b border-gray-200 flex justify-between items-center bg-white shadow-sm md:shadow-none">
                        <div>
                            <h2 className="text-lg md:text-2xl font-serif font-bold text-gray-900">Compare</h2>
                            <p className="text-gray-500 text-[10px] md:text-sm">{visibleList.length} properties</p>
                        </div>
                        <button onClick={closeCompareModal} className="p-2 hover:bg-gray-100 rounded-full transition"><FaTimes size={20} className="text-gray-400 hover:text-gray-900" /></button>
                    </div>

                    {/* Content Scrollable */}
                    <div className="overflow-auto flex-1 custom-scrollbar bg-white">
                        <div
                            className="grid divide-x divide-gray-100"
                            style={{
                                gridTemplateColumns: `minmax(120px, 180px) repeat(${compareList.length}, minmax(180px, 1fr))`
                            }}
                        >

                            {/* Labels Column (Sticky Left) */}
                            <div className="bg-gray-50/95 backdrop-blur-sm sticky left-0 z-20 flex flex-col pt-[260px] md:pt-[320px] border-r border-gray-200 shadow-[4px_0_24px_rgba(0,0,0,0.05)]">
                                {features.map((f, i) => (
                                    <div key={i} className="h-14 md:h-16 flex items-center px-3 md:px-6 font-bold text-gray-500 text-[10px] md:text-xs uppercase tracking-wider bg-transparent border-b border-gray-100">{f.label}</div>
                                ))}
                                <div className="h-14 md:h-16 flex items-center px-3 md:px-6 font-black text-xs md:text-sm text-gray-900 bg-gray-100/50 uppercase tracking-wider mt-4">Amenities</div>
                                {amenitiesMap.map((am, i) => (
                                    <div key={`am-lbl-${i}`} className="h-12 flex items-center px-3 md:px-6 font-medium text-gray-500 text-[10px] md:text-sm border-b border-gray-100">{am.label}</div>
                                ))}
                            </div>

                            {/* Property Columns */}
                            {compareList.map((prop) => (
                                <div key={prop.PropertyId || prop.id} className="flex flex-col relative bg-white min-w-[180px] md:min-w-[280px]">
                                    {/* Sticky Property Header / Image */}
                                    <div className="sticky top-0 bg-white z-10 p-3 md:p-4 border-b border-gray-100 h-[260px] md:h-[320px] flex flex-col transition-shadow duration-300">
                                        <div className="absolute top-2 right-2 z-20">
                                            <button onClick={() => removeFromCompare(prop.PropertyId || prop.id)} className="bg-white/80 p-1.5 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 shadow-sm transition"><FaTimes size={12} /></button>
                                        </div>

                                        <div className="h-[140px] md:h-[180px] w-full rounded-xl md:rounded-2xl overflow-hidden relative mb-3 md:mb-4 shadow-sm group bg-gray-100">
                                            <img
                                                src={prop.ImageUrl || prop.primary_image?.image_url || prop.images?.[0]?.image_url || "https://placehold.co/600x400"}
                                                className="w-full h-full object-cover"
                                                alt={prop.Name}
                                            />
                                            {prop.PropertyType && (
                                                <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-1.5 py-0.5 md:px-2 md:py-1 rounded-md md:rounded-lg text-[8px] md:text-[10px] font-bold text-white uppercase tracking-wider">{prop.PropertyType}</div>
                                            )}
                                        </div>

                                        <h3 className="font-bold text-sm md:text-lg text-gray-900 leading-tight line-clamp-2 mb-1 md:mb-2 h-[40px] md:h-[50px]">{prop.Name || prop.name}</h3>

                                        <button
                                            onClick={() => window.open(`/property/${prop.PropertyId || prop.id}`, '_blank')}
                                            className="mt-auto w-full py-2 md:py-2.5 bg-black text-white rounded-lg md:rounded-xl font-bold text-xs md:text-sm hover:bg-gray-800 transition shadow-lg flex items-center justify-center gap-2"
                                        >
                                            View Details
                                        </button>
                                    </div>

                                    {/* Features Data */}
                                    {features.map((f, i) => (
                                        <div key={i} className="h-14 md:h-16 flex items-center px-3 md:px-6 border-b border-gray-50 text-xs md:text-sm">
                                            {f.render(prop)}
                                        </div>
                                    ))}

                                    {/* Amenities Header Spacer */}
                                    <div className="h-14 md:h-16 bg-gray-50/30 mt-4 border-b border-gray-50"></div>

                                    {/* Amenities Data */}
                                    {amenitiesMap.map((am, i) => {
                                        let hasIt = false;
                                        if (am.keys) {
                                            hasIt = am.keys.some(k => prop.onboarding_data?.amenities?.[k]);
                                        } else if (am.check) {
                                            hasIt = am.check(prop);
                                        }

                                        return (
                                            <div key={`am-data-${i}`} className="h-12 flex items-center px-3 md:px-6 border-b border-gray-50">
                                                {hasIt
                                                    ? <div className="text-green-600 bg-green-50 px-2 py-1 md:px-3 rounded-full text-[10px] md:text-xs font-bold flex gap-1 md:gap-1.5 items-center"><FaCheck size={8} /> <span className="hidden md:inline">Included</span><span className="md:hidden">Yes</span></div>
                                                    : <div className="text-gray-300 px-2 md:px-3 text-[10px] md:text-xs font-bold flex gap-1 items-center"><FaCross size={8} /> - </div>
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
