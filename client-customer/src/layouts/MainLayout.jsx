import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/ui/Header';
import Footer from '../components/ui/Footer';
import ChatWidget from '../components/common/ChatWidget';

import SearchModal from '../components/ui/SearchModal';


import { FaSwimmingPool, FaHome, FaHotel } from 'react-icons/fa';

const CATEGORIES = [
    { id: 'all', label: 'All', icon: <FaHome /> },
    { id: 'villas', label: 'Villa', icon: <FaHotel /> },
    { id: 'waterpark', label: 'Water Park', icon: <FaSwimmingPool /> },
];

export default function MainLayout() {
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [properties, setProperties] = useState([]);
    // Removed local activeCategory state as it's now global in SearchContext
    const navigate = useNavigate();
    const location = useLocation();

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

            <ChatWidget />
            <Footer />
        </div>
    );
}

