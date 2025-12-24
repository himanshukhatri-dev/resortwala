import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';
import L from 'leaflet';

// Fix for default marker icon in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// City Fallbacks (Approximate Lat/Lng)
const CITY_COORDS = {
    'goa': [15.2993, 74.1240],
    'manali': [32.2432, 77.1892],
    'lonavala': [18.7515, 73.4056],
    'shimla': [31.1048, 77.1734],
    'udaipur': [24.5854, 73.7125],
    'jaipur': [26.9124, 75.7873],
    'kerala': [10.8505, 76.2711],
    'rishikesh': [30.0869, 78.2676],
    'mumbai': [19.0760, 72.8777],
    'delhi': [28.7041, 77.1025],
};

function getApproxCoords(property, index) {
    if (property.Latitude && property.Longitude) {
        return [property.Latitude, property.Longitude];
    }

    const city = (property.CityName || property.Location || "").toLowerCase();

    // Find matching city
    let center = [20.5937, 78.9629]; // Default India
    for (const [key, coords] of Object.entries(CITY_COORDS)) {
        if (city.includes(key)) {
            center = coords;
            break;
        }
    }

    // Add jitter so pins don't overlap exactly
    // Use index to consistently place them in a spiral or cluster
    const angle = index * 0.5;
    const radius = 0.005 + (index * 0.0002); // Small spread

    return [
        center[0] + (Math.cos(angle) * radius),
        center[1] + (Math.sin(angle) * radius)
    ];
}

// Marker Icon with Price
const createPriceIcon = (price) => {
    return L.divIcon({
        className: 'custom-price-marker',
        html: `
            <div style="
                background-color: white; 
                color: black; 
                font-weight: bold; 
                padding: 4px 8px; 
                border-radius: 12px; 
                box-shadow: 0 2px 5px rgba(0,0,0,0.3); 
                font-size: 12px;
                border: 1px solid #ccc;
                display: flex;
                align-items: center;
                justify-content: center;
                white-space: nowrap;
                transform: translate(-50%, -50%);
            ">
                ₹${Number(price).toLocaleString()}
            </div>
        `,
        iconSize: [60, 30], // Adjust based on content size
        iconAnchor: [30, 15] // Center it
    });
};

function MapUpdater({ markers, userLocation }) {
    const map = useMap();
    React.useEffect(() => {
        if (userLocation) {
            map.flyTo(userLocation, 12, { duration: 2 });
        } else if (markers.length > 0) {
            const group = new L.featureGroup(markers.map(m => L.marker(m.position)));
            map.fitBounds(group.getBounds(), { padding: [50, 50] });
        }
    }, [markers, map, userLocation]);
    return null;
}

export default function MapView({ properties }) {
    const defaultCenter = [20.5937, 78.9629];

    // Prepare markers with generated coords if needed
    const markers = useMemo(() => {
        if (!properties) return [];
        return properties.map((p, i) => {
            return {
                ...p,
                position: getApproxCoords(p, i)
            };
        });
    }, [properties]);

    const [userLocation, setUserLocation] = React.useState(null);

    const handleLocateMe = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setUserLocation([latitude, longitude]);
                    // You might need to access map instance to flyTo, but simplified for now
                    // For a proper FlyTo, we'd need a component inside MapContainer or useMap
                    // We'll add a <LocateHandler> component below
                },
                (error) => {
                    console.error("Error getting location: ", error);
                    let errorMessage = "Could not access your location.";

                    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                        errorMessage += " Browser security requires HTTPS for location access.";
                    } else if (error.code === 1) {
                        errorMessage += " Permission denied. Please allow location access.";
                    } else if (error.code === 2) {
                        errorMessage += " Location unavailable.";
                    } else if (error.code === 3) {
                        errorMessage += " Request timed out.";
                    }

                    alert(errorMessage);
                }
            );
        } else {
            alert("Geolocation is not supported by your browser.");
        }
    };

    return (
        <div className="h-full w-full rounded-2xl overflow-hidden shadow-2xl border border-gray-200 z-0 relative group">
            <MapContainer center={defaultCenter} zoom={5} scrollWheelZoom={false} className="h-full w-full outline-none">
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapUpdater markers={markers} userLocation={userLocation} />

                {/* User Location Marker */}
                {userLocation && (
                    <Marker position={userLocation} icon={L.divIcon({
                        className: 'user-location-marker',
                        html: '<div style="width: 16px; height: 16px; background: #3b82f6; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>',
                        iconSize: [20, 20],
                        iconAnchor: [10, 10]
                    })}>
                        <Popup>You are here</Popup>
                    </Marker>
                )}

                {markers.map((p, i) => (
                    <Marker
                        key={p.PropertyId || i}
                        position={p.position}
                        icon={createPriceIcon(p.Price || p.price)}
                    >
                        <Popup className="custom-popup" closeButton={false}>
                            <div className="min-w-[240px] p-0 font-sans">
                                <div className="relative h-32 w-full overflow-hidden rounded-t-xl">
                                    <img
                                        src={p.image_path || p.ImageUrl || "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb"}
                                        alt={p.Name}
                                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                                    />
                                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-md text-xs font-bold shadow-sm flex items-center gap-1">
                                        <span>★</span> {p.Rating || '4.8'}
                                    </div>
                                </div>
                                <div className="p-3">
                                    <h3 className="font-bold text-gray-900 truncate text-base mb-0.5">{p.Name}</h3>
                                    <p className="text-xs text-gray-500 mb-3 truncate flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        {p.Location || p.CityName || "Unknown Location"}
                                    </p>
                                    <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Price per night</span>
                                            <span className="font-bold text-lg text-gray-900">₹{Number(p.Price).toLocaleString()}</span>
                                        </div>
                                        <Link
                                            to={`/property/${p.PropertyId}`}
                                            className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 shadow-lg shadow-gray-200"
                                        >
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* Locate Me Button */}
            <button
                onClick={handleLocateMe}
                className="absolute top-4 right-4 z-[400] bg-white text-gray-700 p-3 rounded-xl shadow-lg border border-gray-100 hover:bg-gray-50 hover:text-black transition-all active:scale-95 flex items-center gap-2 font-bold text-xs"
            >
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Locate Me
            </button>
        </div>
    );
}
