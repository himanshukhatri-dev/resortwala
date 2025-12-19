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

function MapUpdater({ markers }) {
    const map = useMap();
    React.useEffect(() => {
        if (markers.length > 0) {
            const group = new L.featureGroup(markers.map(m => L.marker(m.position)));
            map.fitBounds(group.getBounds(), { padding: [50, 50] });
        }
    }, [markers, map]);
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

    return (
        <div className="h-full w-full rounded-2xl overflow-hidden shadow-2xl border border-gray-200 z-0 relative">
            <MapContainer center={defaultCenter} zoom={5} scrollWheelZoom={false} className="h-full w-full">
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapUpdater markers={markers} />

                {markers.map((p, i) => (
                    <Marker
                        key={p.PropertyId || i}
                        position={p.position}
                        icon={createPriceIcon(p.Price || p.price)}
                    >
                        <Popup className="custom-popup">
                            <div className="min-w-[200px]">
                                <div className="h-32 w-full overflow-hidden rounded-t-lg mb-2 relative">
                                    <img
                                        src={p.image_path || p.ImageUrl || "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb"}
                                        alt={p.Name}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-2 right-2 bg-white px-2 py-0.5 rounded text-xs font-bold shadow-sm">
                                        ★ {p.Rating || '4.8'}
                                    </div>
                                </div>
                                <h3 className="font-bold text-sm text-gray-900 truncate">{p.Name}</h3>
                                <p className="text-xs text-gray-500 mb-2 truncate">{p.Location || p.CityName}</p>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="font-bold text-lg text-black">₹{Number(p.Price).toLocaleString()}</span>
                                    <Link
                                        to={`/property/${p.PropertyId}`}
                                        className="text-white bg-black hover:bg-gray-800 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                    >
                                        View
                                    </Link>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
