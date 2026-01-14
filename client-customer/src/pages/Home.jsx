import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import SearchBar from '../components/ui/SearchBar';
import FilterSidebar from '../components/features/FilterSidebar';
import FilterModal from '../components/features/FilterModal';
import PropertyCard from '../components/features/PropertyCard';
import MapView from '../components/features/MapView';
// Framer Motion for Animations
import { motion, AnimatePresence } from 'framer-motion';
import { FaSwimmingPool, FaHome, FaHotel, FaMapMarkedAlt, FaList, FaSearch, FaFilter } from 'react-icons/fa';
import { useSearch } from '../context/SearchContext';
import SEO from '../components/SEO';

const CATEGORIES = [
    { id: 'all', label: 'All', icon: <FaHome /> },
    { id: 'villas', label: 'Villa', icon: <FaHotel /> },
    { id: 'waterpark', label: 'Water Park', icon: <FaSwimmingPool /> },
];

export default function Home() {
    // Global Search State
    const { activeCategory, setActiveCategory } = useSearch();

    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    // Unified Filter State
    const [filters, setFilters] = useState({
        location: '',
        type: 'all',
        min_price: '',
        max_price: '',
        guests: 1,
        veg_only: false,
        amenities: [],
        sort: 'newest'
    });

    const location = useLocation();
    const resultsRef = useRef(null);

    // Hero Carousel State
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const HERO_IMAGES = [
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2070&auto=format&fit=crop", // Beach
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=2070&auto=format&fit=crop", // Resort Pool
        "https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80&w=2070&auto=format&fit=crop", // Luxury Villa
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop"  // Waterpark/Fun
    ];

    // Carousel Timer
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
        }, 5000); // Change every 5 seconds
        return () => clearInterval(timer);
    }, []);

    // Sync activeCategory with Filter State
    useEffect(() => {
        if (activeCategory !== filters.type) {
            setFilters(prev => ({ ...prev, type: activeCategory }));
        }
    }, [activeCategory]);

    // Handle incoming search from MainLayout/Global Bubble
    useEffect(() => {
        if (location.state?.searchFilters) {
            const incoming = location.state.searchFilters;
            setFilters(prev => ({
                ...prev,
                location: incoming.location || '',
                guests: incoming.guests || 1,
                dateRange: incoming.dateRange // Note: Date range filtering not fully backend impl yet, but ready for pass-through
            }));

            if (location.state.activeCategory) {
                setActiveCategory(location.state.activeCategory);
            }

            // Scroll to results
            const navEntry = performance.getEntriesByType("navigation")[0];
            const isReload = navEntry && navEntry.type === 'reload';
            if (!isReload) {
                setTimeout(() => {
                    if (resultsRef.current) {
                        const yOffset = -120;
                        const element = resultsRef.current;
                        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                        window.scrollTo({ top: y, behavior: 'smooth' });
                    }
                }, 500);
            }
        }
    }, [location.state, setActiveCategory]);

    // Pagination State
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    // Fetch Properties (API Driven Filtering)
    const fetchProperties = async (pageToFetch = 1, append = false) => {
        try {
            setLoading(!append);
            if (append) setIsFetchingMore(true);

            // Construct Query String
            const params = new URLSearchParams();
            params.append('page', pageToFetch);

            if (filters.location) params.append('location', filters.location);
            if (filters.type && filters.type !== 'all') params.append('type', filters.type);
            if (filters.min_price) params.append('min_price', filters.min_price);
            if (filters.max_price) params.append('max_price', filters.max_price);
            if (filters.guests > 1) params.append('guests', filters.guests);
            if (filters.veg_only) params.append('veg_only', 'true');
            if (filters.sort) params.append('sort', filters.sort);

            if (filters.amenities && filters.amenities.length > 0) {
                filters.amenities.forEach(a => params.append('amenities[]', a));
            }

            const response = await fetch(`${API_BASE_URL}/properties?${params.toString()}`);

            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();

            // Handle Laravel Pagination Structure
            const newProperties = data.data ? data.data : (Array.isArray(data) ? data : []);
            const fetchedHasMore = data.next_page_url !== null;

            if (append) {
                setProperties(prev => [...prev, ...newProperties]);
            } else {
                setProperties(newProperties);
            }

            setHasMore(fetchedHasMore);
            setPage(pageToFetch);

        } catch (error) {
            console.error("Failed to fetch properties", error);
            if (!append) setProperties([]);
        } finally {
            setLoading(false);
            setIsFetchingMore(false);
        }
    };

    // Refetch when filters change (Debounced)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchProperties(1, false);
        }, 500); // 500ms debounce
        return () => clearTimeout(timeoutId);
    }, [filters]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        fetchProperties(nextPage, true);
    };

    // Update filters from SearchBar
    const handleSearch = (searchFilters, shouldScroll = false) => {
        setFilters(prev => ({
            ...prev,
            ...searchFilters
        }));

        if (shouldScroll) {
            setTimeout(() => {
                if (resultsRef.current) {
                    const yOffset = -120;
                    const element = resultsRef.current;
                    const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                }
            }, 100);
        }
    };

    const containerRef = useRef(null);

    return (
        <div className="pb-20" ref={containerRef}>
            <SEO
                title="Book Luxury Villas & Stays"
                description="Discover the best luxury villas, resorts, and waterparks in Lonavala and beyond. Verified stays, best prices, and instant booking."
            />

            {/* 1. IMMERSIVE HERO */}
            <div className="relative min-h-[85vh] md:min-h-[90vh] w-full bg-gray-900 flex flex-col items-center justify-center text-center px-4 pt-32 pb-12 md:pt-40 md:pb-20">
                {/* Dynamic Background Carousel */}
                <div className="absolute inset-0 overflow-hidden">
                    <AnimatePresence mode='popLayout'>
                        <motion.img
                            key={currentImageIndex} // Key change triggers animation
                            src={HERO_IMAGES[currentImageIndex]}
                            alt="Background"
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    </AnimatePresence>
                    <div className="absolute inset-0 bg-black/50" /> {/* Darker overlay for better text contrast */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-black/40" />
                </div>

                {/* Content */}
                <div className="relative z-30 max-w-5xl w-full flex flex-col items-center animate-fade-up px-4">
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 md:mb-6 drop-shadow-2xl font-serif italic tracking-wide leading-tight text-center">
                        Find your peace in <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-pink-500 not-italic transform hover:scale-105 transition-transform duration-500 inline-block mt-2">paradise</span>
                    </h1>

                    <p className="text-white/95 text-lg md:text-xl mb-6 md:mb-8 max-w-2xl text-center font-light drop-shadow-lg px-2 leading-relaxed">
                        Discover luxury villas, water parks, and hidden gems across India.
                    </p>

                    <div className="mb-2"></div>

                    {/* SEARCH BAR */}
                    <div className="w-full max-w-4xl h-auto scale-100 md:scale-100 origin-top mt-4 md:mt-0">
                        <SearchBar
                            onSearch={handleSearch}
                            isSticky={false}
                            categories={CATEGORIES}
                            compact={true}
                        />
                    </div>
                </div>
            </div>

            {/* 2. RESULTS SECTION */}
            <div ref={resultsRef} className="container mx-auto px-4 py-8 min-h-[50vh] scroll-mt-28 mt-4">

                <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 relative items-start">

                    {/* LEFT COLUMN: Filters (Desktop) */}
                    <div className="hidden lg:block sticky top-24 z-30">
                        <FilterSidebar filters={filters} onFilterChange={setFilters} />
                    </div>

                    {/* RIGHT COLUMN: Results */}
                    <div className="w-full">

                        {/* Header & Controls */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 font-serif">
                                    {filters.location
                                        ? `Stays in ${filters.location}`
                                        : filters.type !== 'all'
                                            ? `${CATEGORIES.find(c => c.id === filters.type)?.label || 'Selected'} Stays`
                                            : "All Properties"
                                    }
                                </h2>
                                <p className="text-gray-500 mt-1 text-sm font-medium">
                                    {loading ? "Searching..." : `${properties.length} properties found`}
                                </p>
                            </div>

                            <div className="flex items-center gap-3 self-start md:self-auto w-full md:w-auto">
                                {/* Mobile Filter Button */}
                                <button
                                    onClick={() => setIsFilterModalOpen(true)}
                                    className="lg:hidden flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold shadow-sm"
                                >
                                    <FaFilter /> Filters
                                </button>

                                {/* View Switcher */}
                                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        <FaList />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('map')}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'map' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        <FaMapMarkedAlt />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Loading State */}
                        {loading && !isFetchingMore ? (
                            <div className="flex flex-col justify-center items-center py-20">
                                <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-4"></div>
                                <p className="text-gray-400 animate-pulse font-bold">Finding the perfect stay...</p>
                            </div>
                        ) : (
                            <>
                                {/* LIST VIEW */}
                                <div className={`w-full ${viewMode === 'map' ? 'hidden' : 'block'}`}>
                                    {properties.length > 0 ? (
                                        <div className="flex flex-col gap-8">
                                            <AnimatePresence mode='popLayout'>
                                                {properties.map((p) => (
                                                    <motion.div
                                                        layout
                                                        key={p.PropertyId || p.id}
                                                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                                        transition={{ duration: 0.4, type: "spring" }}
                                                    >
                                                        <PropertyCard property={p} variant="horizontal" />
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                                <FaSearch className="text-gray-300 text-3xl" />
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-800">No properties found</h3>
                                            <p className="text-gray-500 mb-6 max-w-xs text-sm">We couldn't find any stays matching your current filters.</p>
                                            <button
                                                onClick={() => setFilters({ location: '', type: 'all', min_price: '', max_price: '', guests: 1, veg_only: false, amenities: [], sort: 'newest' })}
                                                className="px-8 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg active:scale-95"
                                            >
                                                Clear all filters
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* MAP VIEW */}
                                <div className={`w-full h-[600px] rounded-2xl overflow-hidden shadow-2xl border border-gray-100 relative ${viewMode === 'list' ? 'hidden' : 'block'}`}>
                                    <MapView properties={properties} />
                                </div>

                                {/* LOAD MORE BUTTON */}
                                {hasMore && (
                                    <div className="flex justify-center mt-12 pb-8">
                                        <button
                                            onClick={handleLoadMore}
                                            disabled={isFetchingMore}
                                            className="px-8 py-3 bg-white border border-gray-200 text-gray-900 rounded-full font-bold shadow-sm hover:shadow-md hover:border-black transition-all flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {isFetchingMore ? <div className="w-5 h-5 border-2 border-gray-300 border-t-black rounded-full animate-spin" /> : 'Load More Properties'}
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <FilterModal
                    isOpen={isFilterModalOpen}
                    onClose={() => setIsFilterModalOpen(false)}
                    filters={filters}
                    onFilterChange={setFilters}
                />

            </div>
        </div >
    );
}
