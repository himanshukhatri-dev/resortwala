import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import L from 'leaflet';

// Fix for default marker icon in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper to center map on markers
function MapUpdater({ properties }) {
    const map = useMap();
    React.useEffect(() => {
        if (properties.length > 0) {
            const bounds = L.latLngBounds(properties.map(p => [
                p.Latitude || p.latitude || 15.2993, // Default to Goa fallback if missing
                p.Longitude || p.longitude || 74.1240
            ]));
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [properties, map]);
    return null;
}

export default function MapView({ properties }) {
    // Default center (India/Goa)
    const center = [15.2993, 74.1240];

    // Filter valid coordinates
    const validProps = properties.filter(p => (p.Latitude || p.latitude) && (p.Longitude || p.longitude));
    // If no valid props, show default view (maybe just show one marker for demo?)
    // Actually, let's use some fake fallback coords for demo if "real" ones are missing, 
    // just to start the map somewhere useful if the DB is empty of coords.
    // For now, only show real ones.

    return (
        <div className="h-[600px] w-full rounded-2xl overflow-hidden shadow-2xl border border-gray-200 z-0 relative">
            <MapContainer center={center} zoom={10} scrollWheelZoom={false} className="h-full w-full">
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapUpdater properties={validProps} />

                {validProps.map((p, i) => {
                    const lat = p.Latitude || p.latitude;
                    const lng = p.Longitude || p.longitude;
                    return (
                        <Marker key={p.id || i} position={[lat, lng]}>
                            <Popup>
                                <div className="min-w-[200px]">
                                    <img
                                        src={p.image || p.ImageUrl || "https://source.unsplash.com/random/300x200?hotel"}
                                        alt={p.Name}
                                        className="w-full h-24 object-cover rounded mb-2"
                                    />
                                    <h3 className="font-bold text-sm truncate">{p.Name || p.name}</h3>
                                    <p className="text-xs text-gray-500 mb-2">{p.Location || p.location}</p>
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-primary">₹{p.Price || p.price || 'NA'}</span>
                                        <Link to={`/property/${p.id || p.PropertyId}`} className="text-xs bg-black text-white px-2 py-1 rounded">
                                            View
                                        </Link>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}
