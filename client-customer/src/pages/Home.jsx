import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { SPECIAL_EVENTS } from '../config/special_events';
import SparkleEffect from '../components/special/SparkleEffect';
import ValentineHearts from '../components/special/ValentineHearts';
import SearchBar from '../components/ui/SearchBar';
import FilterBar from '../components/ui/FilterBar';
import FilterModal from '../components/features/FilterModal';
import PropertyCard from '../components/features/PropertyCard';
import MapView from '../components/features/MapView';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSwimmingPool, FaHome, FaHotel, FaMapMarkedAlt, FaList, FaSearch, FaFilter, FaMapMarkerAlt, FaExchangeAlt } from 'react-icons/fa';
import { useSearch } from '../context/SearchContext';
import { useCompare } from '../context/CompareContext';
import CompareModal from '../components/features/CompareModal';
import SEO from '../components/SEO';
import LocationRichContent from '../components/location/LocationRichContent';
import { PropertyCardSkeleton } from '../components/ui/Skeleton';
import { getPricing } from '../utils/pricing';
import toast from 'react-hot-toast';

const CATEGORIES = [
    { id: 'all', label: 'All', icon: <FaHome /> },
    { id: 'villas', label: 'Villa', icon: <FaHotel /> },
    { id: 'waterpark', label: 'Water Park', icon: <FaSwimmingPool /> },
];

export default function Home({ landingMode = false, landingSeo = null }) {
    // const { activeCategory, setActiveCategory } = useSearch(); // Removed, handled below in sync section
    const { compareList, openCompareModal, isCompareModalOpen, closeCompareModal } = useCompare();

    const [properties, setProperties] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [viewMode, setViewMode] = useState('list');
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    const [searchParams, setSearchParams] = useSearchParams();
    const { city } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const searchResultsRef = useRef(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [availableLocations, setAvailableLocations] = useState([]);
    const [showAllLocations, setShowAllLocations] = useState(false);

    const HERO_IMAGES = [
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2070&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=2070&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80&w=2070&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop"
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const [filters, setFilters] = useState(() => {
        // Initialize from URL Params for persistence
        const p = searchParams;
        const from = p.get('check_in');
        const to = p.get('check_out');

        return {
            location: p.get('location') || '',
            type: p.get('type') || 'all',
            minPrice: p.get('min_price') || '',
            maxPrice: p.get('max_price') || '',
            guests: {
                adults: parseInt(p.get('adults')) || 1,
                children: parseInt(p.get('children')) || 0,
                rooms: parseInt(p.get('rooms')) || 1
            },
            veg_only: p.get('veg_only') === 'true',
            amenities: p.getAll('amenities') || [],
            sort: p.get('sort') || 'newest',
            distance: (p.get('lat') && p.get('lon')) ? {
                center: { lat: parseFloat(p.get('lat')), lon: parseFloat(p.get('lon')), name: p.get('loc_name') || 'Selected Location' },
                maxKm: parseInt(p.get('radius')) || 200
            } : { center: null, maxKm: 200 },
            page: parseInt(p.get('page')) || 1,
            dateRange: from ? {
                from: new Date(from),
                to: to ? new Date(to) : undefined
            } : { from: undefined, to: undefined }
        };
    });

    // Client-Side Filtering for Price Safety (Backstop for API)
    const filteredProperties = useMemo(() => {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        return properties.filter(p => {
            // Dev Only Filter
            if (p.is_developer_only && !isLocal) return false;

            // Price Filter
            if (filters.minPrice || filters.maxPrice) {
                const price = getPricing(p).sellingPrice || p.Price || 0;
                if (filters.minPrice && price < parseFloat(filters.minPrice)) return false;
                if (filters.maxPrice && price > parseFloat(filters.maxPrice)) return false;
            }
            return true;
        });
    }, [properties, filters.minPrice, filters.maxPrice]);

    const isInitialMount = useRef(true);

    const isInternalUrlUpdate = useRef(false);

    // 1. Sync URL -> Filters (Back/Forward Navigation & Initial Sync)
    useEffect(() => {
        if (isInternalUrlUpdate.current) {
            isInternalUrlUpdate.current = false;
            return;
        }

        const p = new URLSearchParams(location.search);
        const from = p.get('check_in');
        const to = p.get('check_out');
        const amenities = p.getAll('amenities') || [];

        // Priority for location: Param city > URL Query location
        const targetLocation = city || p.get('location') || '';

        const nextFilters = {
            location: targetLocation,
            type: p.get('type') || 'all',
            minPrice: p.get('min_price') || '',
            maxPrice: p.get('max_price') || '',
            guests: {
                adults: parseInt(p.get('adults')) || 1,
                children: parseInt(p.get('children')) || 0,
                rooms: parseInt(p.get('rooms')) || 1
            },
            veg_only: p.get('veg_only') === 'true',
            amenities: amenities,
            sort: p.get('sort') || 'newest',
            distance: (p.get('lat') && p.get('lon')) ? {
                center: { lat: parseFloat(p.get('lat')), lon: parseFloat(p.get('lon')), name: p.get('loc_name') || 'Selected Location' },
                maxKm: parseInt(p.get('radius')) || 200
            } : { center: null, maxKm: 200 },
            page: parseInt(p.get('page')) || 1,
            dateRange: from ? {
                from: new Date(from),
                to: to ? new Date(to) : undefined
            } : { from: undefined, to: undefined }
        };

        if (JSON.stringify(filters) !== JSON.stringify(nextFilters)) {
            setFilters(nextFilters);
        }
    }, [location.search, city]);

    const {
        location: contextLocation, setLocation: setContextLocation,
        dateRange: contextDateRange, setDateRange: setContextDateRange,
        guests: contextGuests, setGuests: setContextGuests,
        activeCategory, setActiveCategory: setContextCategory
    } = useSearch();

    // 2. Sync Filters -> Context (WE ONLY PUSH FROM SEARCH PARAMS TO CONTEXT)
    // This handles initial load and back/forward navigation
    useEffect(() => {
        if (!isInternalUrlUpdate.current) {
            if (filters.location !== undefined && filters.location !== contextLocation) {
                setContextLocation(filters.location);
            }

            if (filters.type && filters.type !== activeCategory) {
                setContextCategory(filters.type);
            }

            const filterFromStr = filters.dateRange?.from?.toISOString().split('T')[0] || null;
            const contextFromStr = contextDateRange?.from?.toISOString().split('T')[0] || null;
            if (filterFromStr !== contextFromStr) {
                setContextDateRange(filters.dateRange || { from: undefined, to: undefined });
            }

            if (JSON.stringify(filters.guests) !== JSON.stringify(contextGuests)) {
                setContextGuests(filters.guests);
            }
        }
    }, [filters]); // context dependencies removed to avoid overwrite loops

    // 2.5 Sync Context -> URL (Handle live typing in SearchBar)
    useEffect(() => {
        // If the context location changed and it's different from the current URL filter
        // Push it to URL (replace: true for natural feel)
        if (contextLocation !== filters.location) {
            const timer = setTimeout(() => {
                setSearchParams(prev => {
                    const newP = new URLSearchParams(prev);
                    if (contextLocation) newP.set('location', contextLocation);
                    else newP.delete('location');
                    newP.set('page', '1');
                    return newP;
                }, { replace: true });
            }, 800); // Higher debounce for typing
            return () => clearTimeout(timer);
        }
    }, [contextLocation, setSearchParams]);

    // 4. Handle External Context Changes (Category Tab) -> PUSH TO URL
    const lastContextCategory = useRef(activeCategory);
    useEffect(() => {
        if (activeCategory && activeCategory !== lastContextCategory.current) {
            lastContextCategory.current = activeCategory;
            if (activeCategory !== filters.type) {
                setSearchParams(prev => {
                    const newP = new URLSearchParams(prev);
                    if (activeCategory === 'all') newP.delete('type');
                    else newP.set('type', activeCategory);
                    newP.set('page', '1');
                    return newP;
                }, { replace: false });
            }
        }
    }, [activeCategory, filters.type, setSearchParams]);

    const [userCoords, setUserCoords] = useState(null);

    // Auto-fetch user location on mount for "Distance from You" display
    useEffect(() => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        // toast.loading("Locating you...", { id: 'locating' });

        navigator.geolocation.getCurrentPosition(
            (position) => {
                // toast.success("Location found!", { id: 'locating' });
                setUserCoords({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                });
            },
            (error) => {
                console.log("Auto-location denied or failed", error);
                // toast.error("Please enable location to see distances.", { id: 'locating' });
            },
            { timeout: 10000, maximumAge: 60000 }
        );
    }, []);

    const fetchProperties = async (isLoadMore = false) => {
        try {
            if (isLoadMore) setLoadingMore(true);
            else setLoading(true);

            const params = new URLSearchParams();
            params.append('testali', '1'); // Force bypass cache/logic as requested

            // Dev Mode Flag for Backend Filtering
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            if (isLocal) {
                params.append('dev_mode', 'true');
            }

            // FILTERS: Map filters to API params
            console.log('Home: Building API Params from Filters:', filters);
            const loc = filters.location.trim();
            if (loc) params.append('location', loc);

            if (filters.type && filters.type !== 'all') params.append('type', filters.type);

            if (filters.minPrice) params.append('min_price', filters.minPrice);
            if (filters.maxPrice) params.append('max_price', filters.maxPrice);

            // Handle Guests (Number or Object)
            let guestCount = 1;
            if (typeof filters.guests === 'object') {
                guestCount = (filters.guests.adults || 0) + (filters.guests.children || 0);
                if (filters.guests.rooms > 0 && filters.type === 'villas') params.append('bedrooms', filters.guests.rooms);
            } else {
                guestCount = filters.guests;
            }
            if (guestCount > 1) params.append('guests', guestCount);
            if (filters.veg_only) params.append('veg_only', 'true');
            if (filters.sort) params.append('sort', filters.sort);
            if (filters.amenities && filters.amenities.length > 0) {
                filters.amenities.forEach(a => params.append('amenities[]', a));
            }

            // GEOSPATIAL PARAMS
            if (filters.distance && filters.distance.center) {
                params.append('lat', filters.distance.center.lat);
                params.append('lon', filters.distance.center.lon);
                params.append('radius', filters.distance.maxKm);
            }

            params.append('page', isLoadMore ? (filters.page + 1).toString() : '1');
            params.append('limit', '10');

            // console.log('Home: Fetching URL:', `${API_BASE_URL}/properties?${params.toString()}`);
            const response = await fetch(`${API_BASE_URL}/properties?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            // console.log('Home: API Response Data:', data);

            // Normalizing data including distance_km from backend
            const fetchedProps = (data.data ? data.data : (Array.isArray(data) ? data : [])).map(p => ({
                ...p,
                // Ensure backend distance key is normalized to what PropertyCard expects
                distanceKm: p.distance_km || p.distanceKm
            }));

            if (isLoadMore) {
                setProperties(prev => [...prev, ...fetchedProps]);
                setFilters(prev => ({ ...prev, page: prev.page + 1 }));
            } else {
                console.log("FETCHED PROPERTIES:", fetchedProps.length, fetchedProps);
                setProperties(fetchedProps);
            }
            setPagination(data);

        } catch (error) {
            console.error("Failed to fetch properties", error);
            if (!isLoadMore) {
                setProperties([]);
                setPagination(null); // Ensure pagination is cleared on error
            }
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };



    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/properties/locations`);
                if (res.ok) {
                    const data = await res.json();
                    setAvailableLocations(data ? data : []);
                }
            } catch (error) {
                console.error("Failed to fetch locations", error);
            }
        };
        fetchLocations();
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchProperties(false);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [
        // Flatten dependencies to primitives to avoid object reference changes triggering re-fetches
        filters.location,
        filters.type,
        filters.minPrice,
        filters.maxPrice,
        filters.guests?.adults,
        filters.guests?.children,
        filters.guests?.rooms,
        filters.veg_only,
        filters.sort,
        filters.amenities?.length,
        filters.distance?.maxKm,
        // Only trigger if center actually changes (lat/lon)
        filters.distance?.center?.lat,
        filters.distance?.center?.lon,
        // filters.page -- REMOVED to prevent auto-refetch on Load More state update
    ]);



    const handleFilterChange = (newFiltersOrFn) => {
        setFilters(prev => {
            const newVal = typeof newFiltersOrFn === 'function' ? newFiltersOrFn(prev) : newFiltersOrFn;

            // STRICT MUTUAL EXCLUSION: Text Search vs Distance Search
            // If Location Text is present, clear Distance Center
            if (newVal.location && newVal.location.length > 0) {
                if (newVal.distance?.center) {
                    newVal.distance = { ...newVal.distance, center: null };
                }
            }
            // If Distance Center is present (and changed from null/prev), clear Location Text
            else if (newVal.distance?.center && (!prev.distance?.center || prev.distance.center.lat !== newVal.distance.center.lat)) {
                if (newVal.location) {
                    newVal.location = '';
                }
            }

            return { ...newVal, page: 1 };
        });
    };

    // Explicitly clear distance when searching via SearchBar (Text Search)
    const handleSearch = (searchFilters, shouldScroll = false) => {
        setFilters(prev => ({
            ...prev,
            ...searchFilters,
            distance: { ...prev.distance, center: null },
            page: 1
        }));

        if (shouldScroll) {
            setTimeout(() => {
                if (searchResultsRef.current) {
                    const yOffset = -100; // Offset for sticky header
                    const y = searchResultsRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                }
            }, 100);
        }
    };

    // Popular Location Click
    const handleLocationClick = (locName) => {
        const isActive = filters.location === locName;
        if (isActive) {
            navigate('/');
        } else {
            navigate(`/locations/${locName.toLowerCase()}`);
        }

        // Scroll to results
        setTimeout(() => {
            if (searchResultsRef.current) {
                const yOffset = -100; // Offset for sticky header
                const y = searchResultsRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
        }, 100);
    };

    const handleMapLocationSelect = (center) => {
        setFilters(prev => ({
            ...prev,
            location: '', // Clear text filter
            distance: {
                center: {
                    lat: center.lat,
                    lon: center.lon || center.lng,
                    name: center.name || "Selected Location"
                },
                maxKm: prev.distance?.maxKm || 200
            },
            page: 1
        }));
    };

    return (
        <div className="pb-20" >
            {SPECIAL_EVENTS.REPUBLIC_DAY_LAUNCH.showSparkles && <SparkleEffect />}
            {SPECIAL_EVENTS.VALENTINES_MONTH.enabled && SPECIAL_EVENTS.VALENTINES_MONTH.showHearts && <ValentineHearts />}
            <SEO
                title={city ? `Luxury Villas & Stays in ${city.charAt(0).toUpperCase() + city.slice(1)} | ResortWala` : "Book Luxury Villas & Stays | ResortWala"}
                description={city ? `Find and book the best luxury villas, resorts, and vacation stays in ${city}. Verified properties with the best rates and instant booking.` : "Discover the best luxury villas, resorts, and waterparks in Lonavala and beyond. Verified stays, best prices, and instant booking."}
                url={window.location.href}
            />

            <div className="relative min-h-[80vh] md:min-h-[90vh] w-full bg-gray-900 flex flex-col items-center justify-center text-center px-4 pt-24 pb-8 md:pt-40 md:pb-20">
                <div className="absolute inset-0 overflow-hidden">
                    <AnimatePresence mode='popLayout'>
                        <motion.img
                            key={currentImageIndex}
                            src={HERO_IMAGES[currentImageIndex]}
                            alt="Background"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    </AnimatePresence>
                    <div className="absolute inset-0 bg-black/50" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-black/40" />

                    {/* Valentine Blush Gradient Overlay */}
                    {SPECIAL_EVENTS.VALENTINES_MONTH.enabled && SPECIAL_EVENTS.VALENTINES_MONTH.showHeroGradient && (
                        <div className="absolute inset-0 bg-rose-500/10 mix-blend-soft-light pointer-events-none" />
                    )}
                </div>

                <div className="relative z-50 max-w-5xl w-full flex flex-col items-center animate-fade-up px-4">
                    {landingSeo && landingSeo.h1 ? (
                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-white mb-2 md:mb-6 drop-shadow-2xl font-display tracking-tight leading-tight text-center">
                            {landingSeo.h1}
                        </h1>
                    ) : SPECIAL_EVENTS.VALENTINES_MONTH.enabled ? (
                        <>
                            <motion.span
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-secondary font-bold text-sm md:text-lg mb-2 tracking-wide flex items-center gap-2"
                            >
                                <span className="w-6 h-[1px] bg-secondary/50" />
                                {SPECIAL_EVENTS.VALENTINES_MONTH.heroTitle}
                                <span className="w-6 h-[1px] bg-secondary/50" />
                            </motion.span>
                            <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-white mb-2 md:mb-6 drop-shadow-2xl font-display tracking-tight leading-loose text-center">
                                {SPECIAL_EVENTS.VALENTINES_MONTH.heroSubtitle}
                            </h1>
                        </>
                    ) : (
                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-white mb-2 md:mb-6 drop-shadow-2xl font-display tracking-tight leading-tight text-center">
                            Find your peace in <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-pink-500 not-italic transform hover:scale-105 transition-transform duration-500 inline-block mt-1">paradise</span>
                        </h1>
                    )}

                    <p className="text-white/95 text-base md:text-xl mb-4 md:mb-8 max-w-2xl text-center font-light drop-shadow-lg px-2 leading-relaxed">
                        {SPECIAL_EVENTS.VALENTINES_MONTH.enabled
                            ? SPECIAL_EVENTS.VALENTINES_MONTH.heroHeroText
                            : "Discover luxury villas, water parks, and hidden gems across India."
                        }
                    </p>

                    {SPECIAL_EVENTS.VALENTINES_MONTH.enabled && (
                        <div className="mb-4 text-rose-200/80 text-[10px] md:text-xs font-bold uppercase tracking-widest bg-rose-900/20 px-4 py-1.5 rounded-full border border-rose-500/20 backdrop-blur-sm">
                            Perfect for Valentine’s Week • Feb Getaways • Couple Specials
                        </div>
                    )}

                    <div className="w-full max-w-4xl h-auto scale-100 md:scale-100 origin-top mt-4 md:mt-0 flex flex-col items-center gap-6">
                        <div className="w-full">
                            <SearchBar
                                onSearch={handleSearch}
                                isSticky={false}
                                categories={CATEGORIES}
                                compact={true}
                                properties={properties}
                            />
                        </div>

                        {/* POPULAR LOCATIONS IN HERO - MATCHING TAB STYLE */}
                        {availableLocations && availableLocations.length > 0 && (
                            <div className="flex flex-col items-center gap-3 w-full">
                                <span className="text-white/80 text-[10px] md:text-sm font-bold uppercase tracking-widest drop-shadow">
                                    {activeCategory === 'waterpark' ? 'Top Waterpark Locations' : 'Explore Popular Locations'}
                                </span>
                                <div className="flex flex-wrap justify-center gap-2 max-w-3xl px-2">
                                    {(showAllLocations ? availableLocations : availableLocations.slice(0, 6)).map((loc, idx) => {
                                        const isActive = filters.location === loc.name;
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => handleLocationClick(loc.name)}
                                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all backdrop-blur-md border ${isActive
                                                    ? 'bg-secondary text-white shadow-lg border-secondary scale-105'
                                                    : 'bg-white/10 text-white border-white/20 hover:bg-white/20 hover:border-white/40'
                                                    }`}
                                            >
                                                {loc.name}
                                            </button>
                                        )
                                    })}
                                    {availableLocations.length > 6 && (
                                        <button
                                            onClick={() => setShowAllLocations(!showAllLocations)}
                                            className="text-white/80 hover:text-white text-xs underline decoration-dotted underline-offset-4 font-medium px-4 py-1.5"
                                        >
                                            {showAllLocations ? "Show Less" : "+ More"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div ref={searchResultsRef} className="container mx-auto px-4 py-8 min-h-[50vh] scroll-mt-28 mt-4">

                {/* Full Width Filter Bar (Desktop) */}
                <div className="hidden lg:block sticky top-[calc(80px+env(safe-area-inset-top))] z-40 bg-white/90 backdrop-blur-xl border-b border-gray-100 px-4 py-3 mb-6 -mx-4 shadow-sm transition-all duration-300">
                    <FilterBar filters={filters} onFilterChange={handleFilterChange} availableLocations={[]} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[30%_70%] gap-6 items-start relative">

                    <div className="hidden lg:block sticky top-[148px] h-[calc(100vh-160px)] rounded-3xl overflow-hidden shadow-2xl border border-gray-200 z-10 transition-all duration-300">
                        <MapView properties={filteredProperties} onLocationSelect={handleMapLocationSelect} currentUserLocation={userCoords} />
                    </div>

                    <div className="w-full relative">

                        <div className="lg:hidden sticky top-[calc(80px+env(safe-area-inset-top))] z-40 bg-white shadow-md rounded-xl p-2 mb-4 flex items-center justify-between transition-all duration-300">
                            <button onClick={() => setIsFilterModalOpen(true)} className="flex items-center gap-2 px-4 py-2 font-bold text-sm bg-gray-50 rounded-lg text-gray-700">
                                <FaFilter /> Filters
                            </button>
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-black' : 'text-gray-500'}`}><FaList /></button>
                                <button onClick={() => setViewMode('map')} className={`p-2 rounded-md transition-all ${viewMode === 'map' ? 'bg-white shadow text-black' : 'text-gray-500'}`}><FaMapMarkedAlt /></button>
                            </div>
                        </div>

                        {viewMode === 'map' && (
                            <div className="lg:hidden w-full h-[60vh] rounded-2xl overflow-hidden shadow-xl mb-6 border border-gray-100">
                                <MapView properties={filteredProperties} onLocationSelect={handleMapLocationSelect} currentUserLocation={userCoords} />
                            </div>
                        )}

                        <div className={`flex flex-col gap-6 ${viewMode === 'map' ? 'hidden lg:flex' : 'flex'}`}>

                            <div className="mb-2 px-2">
                                <h2 className="text-xl md:text-2xl font-bold text-gray-900 font-display tracking-tight">
                                    {(() => {
                                        const category = CATEGORIES.find(c => c.id === filters.type);
                                        const catLabel = category && filters.type !== 'all' ? category.label : 'Properties';
                                        // Simple pluralization
                                        const catPlural = catLabel.endsWith('s') ? catLabel : `${catLabel}s`;

                                        if (filters.location) {
                                            return `Popular ${catPlural} in ${filters.location}`;
                                        }
                                        if (filters.distance?.center) {
                                            return `Popular ${catPlural} near ${filters.distance.center.name || 'Location'}`;
                                        }
                                        if (filters.type !== 'all') {
                                            return `Popular ${catPlural}`;
                                        }
                                        return "Popular Properties";
                                    })()}
                                </h2>
                                <p className="text-gray-500 mt-1 text-sm font-medium">{loading ? "Searching properties..." : ""}</p>
                            </div>

                            {loading && properties.length === 0 ? (
                                <div className="grid grid-cols-1 gap-6">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <PropertyCardSkeleton key={i} />
                                    ))}
                                </div>
                            ) : (
                                <div className={`transition-opacity duration-200 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                                    {filteredProperties.length > 0 ? (
                                        <>
                                            <AnimatePresence mode='popLayout'>
                                                {filteredProperties.map((p) => (
                                                    <motion.div
                                                        layout
                                                        key={`${p.PropertyId || p.id}-${p.created_at}`}
                                                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                                        transition={{ duration: 0.4, type: "spring" }}
                                                    >
                                                        <PropertyCard property={p} variant="horizontal" />
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>

                                            {pagination && pagination.current_page < pagination.last_page && (
                                                <div className="flex justify-center mt-8 pt-4 border-t border-gray-100">
                                                    <button
                                                        onClick={() => fetchProperties(true)}
                                                        disabled={loadingMore}
                                                        className="px-8 py-3 bg-white border-2 border-gray-100 text-gray-800 font-bold rounded-2xl shadow-sm hover:bg-gray-50 hover:border-[#EAB308] hover:text-[#EAB308] transition-all flex items-center gap-3 active:scale-95"
                                                    >
                                                        {loadingMore ? (
                                                            <>
                                                                <div className="w-4 h-4 border-2 border-[#EAB308] border-t-transparent rounded-full animate-spin" />
                                                                Loading...
                                                            </>
                                                        ) : (
                                                            <>
                                                                Load More Properties
                                                                <FaChevronDown className="text-xs" />
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                                <FaSearch className="text-gray-300 text-3xl" />
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-800">No properties found</h3>
                                            <p className="text-gray-500 mb-6 max-w-xs text-sm">Try adjusting your filters to find what you're looking for.</p>
                                            <button
                                                onClick={() => setFilters({ location: '', type: 'all', minPrice: '', maxPrice: '', guests: 1, veg_only: false, amenities: [], sort: 'newest', distance: { center: null, maxKm: 200 }, page: 1 })}
                                                className="px-8 py-3 bg-[#EAB308] text-white rounded-xl font-bold hover:bg-yellow-600 transition-all shadow-lg active:scale-95"
                                            >
                                                Clear all filters
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>


                {/* Local SEO Content - Only shows if city/location is selected */}
                {(filters.location || city || landingMode) && (
                    <LocationRichContent
                        locationKey={filters.location || city}
                        dynamicContent={landingSeo}
                    />
                )}

                <FilterModal
                    isOpen={isFilterModalOpen}
                    onClose={() => setIsFilterModalOpen(false)}
                    filters={filters}
                    onFilterChange={setFilters}
                />

                <CompareModal
                    isOpen={isCompareModalOpen}
                    onClose={closeCompareModal}
                />

                {/* Floating Compare Bar Removed (Handled globally in App.jsx via CompareFloatingBar) */}

            </div>
        </div >
    );
}

function FaChevronDown({ className }) {
    return <svg className={className} stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M207.029 381.476L12.686 187.132c-9.373-9.373-9.373-24.569 0-33.941l22.667-22.667c9.357-9.357 24.522-9.375 33.901-.04L224 284.505l154.745-154.021c9.379-9.335 24.544-9.317 33.901.04l22.667 22.667c9.373 9.373 9.373 24.569 0 33.941L240.971 381.476c-9.373 9.372-24.569 9.372-33.942 0z"></path></svg>;
}
