import React, { useState, useEffect, useRef } from 'react';
import SearchBar from '../components/ui/SearchBar';
import PropertyCard from '../components/features/PropertyCard';
import { FaSwimmingPool, FaUmbrellaBeach, FaMountain, FaHome, FaHotel } from 'react-icons/fa';

const CATEGORIES = [
    { id: 'all', label: 'All', icon: <FaHome /> },
    { id: 'villas', label: 'Villa', icon: <FaHotel /> },
    { id: 'waterpark', label: 'Water Park', icon: <FaSwimmingPool /> },
];

export default function Home() {
    const [activeCategory, setActiveCategory] = useState('all');
    const [properties, setProperties] = useState([]);
    const [filteredProperties, setFilteredProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useState(null); // To track active search

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                // Ensure this matches your Laravel API route
                // Try LAN IP first, fallback/debug if fails
                console.log("Fetching properties...");

                // Using proxy (vite.config.js) to avoid CORS
                const response = await fetch('/api/properties');

                if (!response.ok) throw new Error('Failed to fetch');
                const data = await response.json();

                // Safety check: ensure data is an array
                const safeData = Array.isArray(data) ? data : [];
                console.log("Properties fetched:", safeData.length);

                setProperties(safeData);
                setFilteredProperties(safeData);
            } catch (error) {
                console.error("Failed to fetch properties", error);

                setProperties([]);
                setFilteredProperties([]);
            } finally {
                setLoading(false);
            }
        };
        fetchProperties();
    }, []);

    // Unified Filtering Effect
    useEffect(() => {
        // Safety guard: ensure properties is array
        if (!properties || !Array.isArray(properties)) {
            setFilteredProperties([]);
            return;
        }

        let result = properties;

        // 1. Filter by Category
        if (activeCategory !== 'all') {
            result = result.filter(p => {
                if (!p) return false;
                const type = (p.PropertyType || p.property_type || "").toLowerCase();
                const name = (p.Name || p.name || "").toLowerCase();
                const desc = (p.LongDescription || p.long_description || "").toLowerCase();

                if (activeCategory === 'villas') return type.includes('villa') || name.includes('villa');
                if (activeCategory === 'waterpark') return name.includes('water') || desc.includes('pool') || desc.includes('slide');
                return true;
            });
        }

        // 2. Filter by Search Params
        if (searchParams) {
            const { location } = searchParams;
            if (location) {
                const term = location.toLowerCase();
                result = result.filter(p => {
                    if (!p) return false;
                    const pLoc = (p.Location || p.location || "").toLowerCase();
                    const pCity = (p.CityName || p.city_name || "").toLowerCase();
                    const pName = (p.Name || p.name || "").toLowerCase();
                    return pLoc.includes(term) || pCity.includes(term) || pName.includes(term);
                });
            }
        }

        setFilteredProperties(result);
    }, [properties, activeCategory, searchParams]);

    const handleSearch = (filters) => {
        setSearchParams(filters);
    };

    const [scrolled, setScrolled] = useState(false);
    const sentinelRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            setScrolled(!entry.isIntersecting && entry.boundingClientRect.top < 0);
        }, {
            rootMargin: "-80px 0px 0px 0px", // Trigger when it hits the top (minus header height?)
            threshold: 0
        });

        if (sentinelRef.current) observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div className="pb-20">
            {/* SENTINEL FOR STICKY SEARCH */}
            <div ref={sentinelRef} className="absolute top-[60vh] w-full h-1 pointer-events-none opacity-0" />

            {/* 1. IMMERSIVE HERO */}
            <div className="relative h-[85vh] w-full bg-black flex flex-col items-center justify-center text-center px-4 z-40">
                {/* Background */}
                <div className="absolute inset-0 overflow-hidden">
                    <img
                        src="https://images.unsplash.com/photo-1512918760532-3ed64bc80e89?q=80&w=2070&auto=format&fit=crop"
                        alt="Background"
                        className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                </div>

                {/* Content */}
                <div className="relative z-10 max-w-5xl w-full flex flex-col items-center animate-fade-up">
                    <img src="/resortwala-logo.png" alt="ResortWala" className="h-24 md:h-32 w-auto mb-8 drop-shadow-xl" />

                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-lg">
                        Find your peace in <span className="text-primary">paradise</span>
                    </h1>

                    {/* Placeholder for SearchBar when it is sticky (prevents layout jump) */}
                    <div className="w-full mt-8 h-[80px]">
                        <SearchBar onSearch={handleSearch} isSticky={scrolled} properties={properties} />
                    </div>
                </div>
            </div>

            {/* 2. CATEGORIES (Sticky) */}
            <div className="sticky top-[80px] z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 py-4 shadow-sm">
                <div className="container mx-auto px-4 flex justify-center gap-4 overflow-x-auto no-scrollbar">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all whitespace-nowrap ${activeCategory === cat.id
                                ? 'bg-black text-white shadow-lg scale-105'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {cat.icon}
                            <span className="font-medium text-sm">{cat.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* 3. PROPERTY GRID */}
            <div className="container mx-auto px-4 py-12">
                <h2 className="text-2xl font-bold mb-8">Fan favorites</h2>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
                        {filteredProperties.map((p, i) => (
                            <div key={p.id || i} className="animate-fade-up" style={{ animationDelay: `${i * 100}ms` }}>
                                <PropertyCard property={p} searchParams={searchParams} />
                            </div>
                        ))}
                        {filteredProperties.length === 0 && (
                            <div className="col-span-full text-center py-20 text-gray-500">
                                No properties found matching your search.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* DEBUG FOOTER */}
            <div className={`fixed bottom-0 left-0 right-0 text-white text-xs p-2 z-[9999] pointer-events-none break-all ${properties.length === 0 ? 'bg-red-900' : 'bg-black/80'}`}>
                Status: {loading ? 'Loading...' : `Loaded ${properties.length} props`}
                | {properties.length === 0 && !loading ? 'ERROR: See Console' : `Key: ${properties[0] ? Object.keys(properties[0])[0] : 'None'}`}
            </div>
        </div>
    );
}
