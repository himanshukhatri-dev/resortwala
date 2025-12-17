import React, { useState, useEffect, useRef } from 'react';
import SearchBar from '../components/ui/SearchBar';
import FilterBar from '../components/ui/FilterBar';
import { motion, AnimatePresence } from 'framer-motion';
import PropertyCard from '../components/features/PropertyCard';
import MapView from '../components/features/MapView';
import { FaSwimmingPool, FaUmbrellaBeach, FaMountain, FaHome, FaHotel, FaMapMarkedAlt, FaList } from 'react-icons/fa';

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
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'

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

    const [advancedFilters, setAdvancedFilters] = useState({
        sortBy: 'all',
        minPrice: '',
        maxPrice: '',
        amenities: []
    });

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

        // 2. Filter by Search Params (Location)
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

        // 3. Filter by Price Range
        if (advancedFilters.minPrice) {
            result = result.filter(p => Number(p.Price) >= Number(advancedFilters.minPrice));
        }
        if (advancedFilters.maxPrice) {
            result = result.filter(p => Number(p.Price) <= Number(advancedFilters.maxPrice));
        }

        // 4. Filter by Amenities (Text Search)
        // Since Amenities may not be structured, we search descriptions for keywords
        if (advancedFilters.amenities.length > 0) {
            result = result.filter(p => {
                const text = JSON.stringify(p).toLowerCase();
                return advancedFilters.amenities.every(amenity => text.includes(amenity));
            });
        }

        // 5. Sort
        if (advancedFilters.sortBy === 'price_low') {
            result.sort((a, b) => Number(a.Price) - Number(b.Price));
        } else if (advancedFilters.sortBy === 'price_high') {
            result.sort((a, b) => Number(b.Price) - Number(a.Price));
        } else if (advancedFilters.sortBy === 'rating_high') {
            // Mock rating property if missing
            result.sort((a, b) => (b.Rating || 0) - (a.Rating || 0));
        }

        setFilteredProperties([...result]); // Spread to trigger re-render
    }, [properties, activeCategory, searchParams, advancedFilters]);

    const handleSearch = (filters) => {
        setSearchParams(filters);
    };

    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
        const handleScroll = () => {
            // Trigger when scrolled past 400px
            const threshold = 400;
            setScrolled(window.scrollY > threshold);
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll(); // Initial check

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="pb-20">
            {/* 1. IMMERSIVE HERO */}
            <div className="relative min-h-[350px] md:min-h-[600px] h-auto md:h-[75vh] w-full bg-gray-900 flex flex-col items-center justify-center text-center px-4 pt-24 pb-8 md:pt-20 md:pb-20">
                {/* Background */}
                <div className="absolute inset-0 overflow-hidden">
                    <img
                        src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2070&auto=format&fit=crop"
                        alt="Sunrise Background"
                        className="w-full h-full object-cover opacity-100"
                    />
                    {/* Lighter Dark Overlay for text readability (sunrise needs less overlay) */}
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-black/10" />
                </div>

                {/* Content */}
                <div className="relative z-10 max-w-5xl w-full flex flex-col items-center animate-fade-up px-4">

                    <h1 className="text-2xl md:text-7xl font-bold text-white mb-3 md:mb-6 drop-shadow-2xl font-serif italic tracking-wide leading-tight text-center">
                        Find your peace in <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-pink-500 not-italic transform hover:scale-105 transition-transform duration-500 inline-block mt-1 md:mt-2">paradise</span>
                    </h1>

                    <p className="text-white/90 text-sm md:text-xl mb-4 md:mb-8 max-w-2xl text-center font-light drop-shadow-lg px-2">
                        Discover luxury villas, water parks, and hidden gems across India's most beautiful destinations.
                    </p>

                    {/* CATEGORIES (Moved Inside Hero) */}
                    <div className="flex gap-3 mb-6 overflow-x-auto no-scrollbar max-w-full pb-4">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all whitespace-nowrap backdrop-blur-xl border ${activeCategory === cat.id
                                    ? 'bg-white/20 text-white shadow-2xl scale-105 border-white/50'
                                    : 'bg-black/20 text-white/80 hover:bg-black/40 border-white/10'
                                    }`}
                            >
                                <span className="text-lg">{cat.icon}</span>
                                <span className="font-medium text-sm tracking-wide">{cat.label}</span>
                            </button>
                        ))}
                    </div>

                </div>

                {/* SEARCH BAR (Outside animated container to fix sticky positioning) */}
                <div className="relative z-40 w-full flex justify-center">
                    {/* Placeholder for SearchBar when it is sticky (prevents layout jump) */}
                    <div className="w-full max-w-5xl h-[80px]">
                        <SearchBar
                            onSearch={handleSearch}
                            isSticky={scrolled}
                            properties={properties}
                            categories={CATEGORIES}
                            activeCategory={activeCategory}
                            onCategoryChange={setActiveCategory}
                        />
                    </div>
                </div>
            </div>


            {/* FILTER BAR SECTION */}
            <div className="container mx-auto px-4 -mt-6 relative z-30">
                <FilterBar onFilterChange={setAdvancedFilters} />
            </div>

            {/* 3. SPLIT LAYOUT (Map + List) */}
            <div className="container mx-auto px-4 py-6 min-h-[50vh]">

                {/* DYNAMIC HEADER (Mobile Toggle Only) */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 pb-4 border-b border-gray-200">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-serif">
                            {searchParams?.location
                                ? `Stays in ${searchParams.location}`
                                : activeCategory !== 'all'
                                    ? `${CATEGORIES.find(c => c.id === activeCategory)?.label || 'Selected'} Stays`
                                    : "All Properties"
                            }
                        </h2>
                        <p className="text-gray-500 mt-1 text-sm">
                            {loading
                                ? "Searching..."
                                : `${filteredProperties.length} properties found`
                            }
                        </p>
                    </div>

                    {/* Mobile View Toggle (Hidden on LG) */}
                    <div className="lg:hidden flex items-center bg-gray-100 rounded-lg p-1 mt-4 md:mt-0 self-start md:self-auto">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <FaList /> List
                        </button>
                        <button
                            onClick={() => setViewMode('map')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'map' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <FaMapMarkedAlt /> Map
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col justify-center items-center py-20">
                        <div className="w-16 h-16 border-4 border-gray-200 border-t-primary rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-400 animate-pulse">Loading amazing places...</p>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-6 relative">

                        {/* LEFT COLUMN: Property List (Scrollable) */}
                        <div className={`w-full lg:w-[60%] lg:pr-2 ${viewMode === 'map' ? 'hidden lg:block' : 'block'}`}>
                            {filteredProperties.length > 0 ? (
                                <div className="flex flex-col gap-8">
                                    <AnimatePresence mode='popLayout'>
                                        {filteredProperties.map((p) => (
                                            <motion.div
                                                layout
                                                key={p.PropertyId || p.id} // Ensure stable key
                                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                                transition={{ duration: 0.4, type: "spring", stiffness: 100 }}
                                            >
                                                <PropertyCard property={p} searchParams={searchParams} variant="horizontal" />
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <h3 className="text-xl font-bold text-gray-800">No properties found</h3>
                                    <p className="text-gray-500 mb-4">Try changing your search.</p>
                                    <button onClick={() => { setActiveCategory('all'); setSearchParams(null); }} className="text-primary hover:underline">Clear Filters</button>
                                </div>
                            )}
                        </div>

                        {/* RIGHT COLUMN: Map (Sticky) */}
                        <div className={`w-full lg:w-[40%] text-black ${viewMode === 'list' ? 'hidden lg:block' : 'block h-[60vh]'}`}>
                            <div className="sticky top-[100px] h-[calc(100vh-120px)] rounded-xl overflow-hidden shadow-xl border border-gray-200">
                                <MapView properties={filteredProperties} />
                            </div>
                        </div>

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
