import { API_BASE_URL } from '../config';
import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/ui/Header';
import Footer from '../components/ui/Footer';
import SearchModal from '../components/ui/SearchModal';


import { FaSwimmingPool, FaHome, FaHotel } from 'react-icons/fa';

const CATEGORIES = [
    { id: 'all', label: 'All', icon: <FaHome /> },
    { id: 'villas', label: 'Villa', icon: <FaHotel /> },
    { id: 'waterpark', label: 'Water Park', icon: <FaSwimmingPool /> },
];

import { useWishlist } from '../context/WishlistContext';
import { toast } from 'react-hot-toast';

export default function MainLayout() {
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [properties, setProperties] = useState([]);
    // Removed local activeCategory state as it's now global in SearchContext
    const navigate = useNavigate();
    const location = useLocation();
    const { toggleWishlist } = useWishlist();
    const processingRef = useRef(null);

    // Handle pending actions (e.g. wishlist after login)
    useEffect(() => {
        if (location.state?.action === 'wishlist' && location.state?.propertyId) {
            const { propertyId } = location.state;

            // Prevent duplicate execution if already processing this ID
            if (processingRef.current === propertyId) return;

            processingRef.current = propertyId;

            toggleWishlist(propertyId).then(result => {
                if (result.success) toast.success(result.message);
                else toast.error(result.message);

                // Clear state
                navigate(location.pathname + location.search, { replace: true, state: {} });
                processingRef.current = null;
            });
        }
    }, [location.state, toggleWishlist, navigate, location.pathname, location.search]);

    // Fetch properties for search autocomplete
    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/properties`);
                if (response.ok) {
                    const data = await response.json();
                    setProperties(Array.isArray(data) ? data : []);
                }
            } catch (error) {
                console.error("Failed to fetch properties for search", error);
            }
        };
        fetchProperties();
    }, []);

    const handleSearch = (filters) => {
        setShowSearchModal(false);
        // Navigate to Home with search filters
        // No need to pass activeCategory, it's global now
        navigate('/', { state: { searchFilters: filters } });
    };

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
        <div className="flex flex-col min-h-screen bg-white font-sans text-gray-900 relative">
            <Header
                onOpenSearch={() => setShowSearchModal(true)}
                onSearch={handleSearch}
                properties={properties}
                categories={CATEGORIES}
            />

            <main className="flex-grow">
                <Outlet />
            </main>

            <SearchModal
                isOpen={showSearchModal}
                onClose={() => setShowSearchModal(false)}
                onSearch={handleSearch}
                properties={properties}
                categories={CATEGORIES}
            />

            <Footer />
        </div>
    );
}

