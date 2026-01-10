import React from 'react';
import { FaCouch, FaBed, FaTv, FaWind, FaHotTub, FaTshirt, FaRestroom, FaBath, FaToilet } from 'react-icons/fa';
import { RiSafeLine } from 'react-icons/ri'; // For safety/wardrobe usage if needed or generic

const RoomCard = ({ name, details, icon }) => {
    // Map amenities to Icons
    const amenities = [
        { key: 'ac', label: 'AC', icon: <FaWind /> },
        { key: 'tv', label: 'TV', icon: <FaTv /> },
        { key: 'wardrobe', label: 'Wardrobe', icon: <FaTshirt /> },
        { key: 'geyser', label: 'Geyser', icon: <FaHotTub /> },
        { key: 'attachedBathroom', label: 'Attached Bathroom', icon: <FaBath /> }, // For Bedrooms
        { key: 'bathroom', label: 'Bathroom', icon: <FaRestroom /> } // For Living Room
    ];

    // Filter available amenities
    const availableAmenities = amenities.filter(a => details[a.key]);

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4 mb-4 border-b border-gray-50 pb-4">
                <div className="bg-gray-50 p-3 rounded-xl text-gray-400 text-xl">
                    {icon}
                </div>
                <div>
                    <h3 className="font-bold text-gray-900">{name}</h3>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-0.5">{details.bedType || "Standard"} Bed</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                {availableAmenities.map((amenity, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-gray-600">
                        <span className="text-gray-400 text-sm">{amenity.icon}</span>
                        <span className="text-xs font-semibold">{amenity.label}</span>
                    </div>
                ))}

                {/* Specific checks for bathroom details if attachedBathroom or bathroom is true */}
                {(details.attachedBathroom || details.bathroom) && details.toiletType && (
                    <div className="flex items-center gap-2 text-gray-600">
                        <span className="text-gray-400 text-sm"><FaToilet /></span>
                        <span className="text-xs font-semibold">{details.toiletType} Toilet</span>
                    </div>
                )}
            </div>

            {availableAmenities.length === 0 && !details.toiletType && (
                <div className="text-xs text-gray-400 italic">No specific amenities configured.</div>
            )}
        </div>
    );
};

export default RoomCard;
