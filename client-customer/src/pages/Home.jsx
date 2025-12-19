import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import SearchBar from '../components/ui/SearchBar';
import FilterBar from '../components/ui/FilterBar';
import PropertyCard from '../components/features/PropertyCard';
import MapView from '../components/features/MapView';
// Framer Motion for Animations
import { motion, AnimatePresence } from 'framer-motion';
import { FaSwimmingPool, FaHome, FaHotel, FaMapMarkedAlt, FaList, FaSearch } from 'react-icons/fa';

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
    const [hasSearched, setHasSearched] = useState(false);
    const location = useLocation();
    const resultsRef = useRef(null);

    // Handle incoming search from MainLayout/Global Bubble
    useEffect(() => {
        if (location.state?.searchFilters) {
            setSearchParams(location.state.searchFilters);
            setHasSearched(true);
            if (location.state.activeCategory) {
                setActiveCategory(location.state.activeCategory);
            }
            // Scroll to results
            setTimeout(() => {
                if (resultsRef.current) {
                    const yOffset = -120;
                    const element = resultsRef.current;
                    const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                }
            }, 500); // Slightly longer delay to ensure page load/render
        }
    }, [location.state]);

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                // Ensure this matches your Laravel API route
                // Try LAN IP first, fallback/debug if fails
                console.log("Fetching properties from:", API_BASE_URL);

                // Using proxy (vite.config.js) to avoid CORS
                const response = await fetch(`${API_BASE_URL}/properties`);

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
            result = result.filter(p => {
                const price = Number(p.Price || p.PricePerNight || 0);
                return price >= Number(advancedFilters.minPrice);
            });
        }
        if (advancedFilters.maxPrice) {
            result = result.filter(p => {
                const price = Number(p.Price || p.PricePerNight || 0);
                return price <= Number(advancedFilters.maxPrice);
            });
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
            result.sort((a, b) => Number(a.Price || a.PricePerNight || 0) - Number(b.Price || b.PricePerNight || 0));
        } else if (advancedFilters.sortBy === 'price_high') {
            result.sort((a, b) => Number(b.Price || b.PricePerNight || 0) - Number(a.Price || a.PricePerNight || 0));
        } else if (advancedFilters.sortBy === 'rating_high') {
            // Mock rating property if missing
            result.sort((a, b) => (b.Rating || 0) - (a.Rating || 0));
        }

        setFilteredProperties([...result]); // Spread to trigger re-render
    }, [properties, activeCategory, searchParams, advancedFilters]);


    const handleSearch = (filters) => {
        setSearchParams(filters);
        setHasSearched(true);
        // Scroll to results after a short delay to allow state update
        setTimeout(() => {
            if (resultsRef.current) {
                const yOffset = -120; // Offset for sticky header
                const element = resultsRef.current;
                const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
        }, 100);
    };

    const containerRef = useRef(null);
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
        const handleScroll = () => {
            const threshold = 300;
            setScrolled(window.scrollY > threshold);
        };
        window.addEventListener('scroll', handleScroll);
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="pb-20" ref={containerRef}>
            {/* 1. IMMERSIVE HERO */}
            <div className="relative min-h-[200px] md:min-h-[250px] w-full bg-gray-900 flex flex-col items-center justify-center text-center px-4 pt-20 pb-8 md:pt-24 md:pb-10">
                {/* Background */}
                <div className="absolute inset-0 overflow-hidden">
                    <img
                        src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2070&auto=format&fit=crop"
                        alt="Sunrise Background"
                        className="w-full h-full object-cover opacity-100"
                    />
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-black/10" />
                </div>

                {/* Content */}
                <div className="relative z-30 max-w-5xl w-full flex flex-col items-center animate-fade-up px-4">
                    <h1 className="text-xl md:text-3xl font-bold text-white mb-1 md:mb-2 drop-shadow-2xl font-serif italic tracking-wide leading-tight text-center">
                        Find your peace in <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-pink-500 not-italic transform hover:scale-105 transition-transform duration-500 inline-block mt-0.5">paradise</span>
                    </h1>

                    <p className="text-white/90 text-xs md:text-sm mb-2 md:mb-4 max-w-xl text-center font-light drop-shadow-lg px-2">
                        Discover luxury villas, water parks, and hidden gems across India.
                    </p>

                    {/* CATEGORIES - Handled by SearchBar now */}
                    <div className="mb-2"></div>

                    {/* SEARCH BAR - Integrated into Hero Flow */}
                    <div className="w-full max-w-4xl h-auto scale-90 md:scale-100 origin-top">
                        <SearchBar
                            onSearch={handleSearch}
                            isSticky={false} // Disabled sticky behavior here as we use Bubble now
                            properties={properties}
                            categories={CATEGORIES}
                            activeCategory={activeCategory}
                            onCategoryChange={(cat) => { setActiveCategory(cat); setHasSearched(true); }}
                            compact={true}
                        />
                    </div>
                </div>
            </div>

            {/* 3. COLUMNS LAYOUT (Filter + List + Map) */}
            <div ref={resultsRef} className="container mx-auto px-4 py-6 min-h-[50vh] scroll-mt-28 mt-4">

                {/* DYNAMIC HEADER */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 pb-2">
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
                    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8 relative items-start">

                        {/* LEFT COLUMN: Map (Sticky) */}
                        <div className={`w-full lg:block ${viewMode === 'list' ? 'hidden' : 'block'} sticky top-[100px] h-[calc(100vh-140px)]`}>
                            <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-gray-100 relative group">
                                <MapView properties={filteredProperties} />
                                <div className="absolute top-4 left-4 z-[1000] opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl border border-gray-100 shadow-xl flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                                        <span className="text-[11px] font-bold text-gray-900 uppercase tracking-wider">Live Map View</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Property List */}
                        <div className={`w-full ${viewMode === 'map' ? 'hidden lg:block' : 'block'}`}>

                            {/* HORIZONTAL FILTERS */}
                            <div className="mb-6">
                                <FilterBar onFilterChange={setAdvancedFilters} />
                            </div>

                            {filteredProperties.length > 0 ? (
                                <div className="flex flex-col gap-8">
                                    <AnimatePresence mode='popLayout'>
                                        {filteredProperties.map((p) => (
                                            <motion.div
                                                layout
                                                key={p.PropertyId || p.id}
                                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                                transition={{
                                                    layout: { type: "spring", stiffness: 45, damping: 12 }, // Bouncy sort
                                                    opacity: { duration: 0.3 },
                                                    y: { type: "spring", stiffness: 100, damping: 20 }
                                                }}
                                            >
                                                <PropertyCard property={p} searchParams={searchParams} variant="horizontal" />
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-24 text-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                        <FaSearch className="text-gray-300 text-3xl" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-800">No properties found</h3>
                                    <p className="text-gray-500 mb-6 max-w-xs">We couldn't find any stays matching your current filters.</p>
                                    <button
                                        onClick={() => { setActiveCategory('all'); setSearchParams(null); setAdvancedFilters({ sortBy: 'all', minPrice: '', maxPrice: '', amenities: [] }); }}
                                        className="px-8 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg active:scale-95"
                                    >
                                        Clear all filters
                                    </button>
                                </div>
                            )}
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}
