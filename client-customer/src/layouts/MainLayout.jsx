import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/ui/Header';
import Footer from '../components/ui/Footer';
import ChatWidget from '../components/common/ChatWidget';
import DraggableSearchBubble from '../components/ui/DraggableSearchBubble';
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
    const [activeCategory, setActiveCategory] = useState('all');
    const navigate = useNavigate();
    const location = useLocation();

    // Fetch properties for search autocomplete
    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const response = await fetch('/api/properties');
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
        navigate('/', { state: { searchFilters: filters, activeCategory } });
    };

    // Show bubble on all pages, or maybe hide on specific ones if needed
    // User requested: "search bubble to be kept on second page as well" ie PropertyDetails
    // So we show it everywhere.

    // Optional: Hide bubble on Home because Home has its own big search bar? 
    // User said: "search bubble to be above whatsapp bubble".
    // Previously in Home.jsx it was shown on scroll.
    // If we move it here, we should probably keep the scroll logic OR show it always?
    // User said "search bubble to be kept on second page". 
    // Let's implement scroll logic here too, or just show it effectively.
    // Let's keep scroll logic for Home, but for other pages maybe show always?
    // Actually, simplifying: Use the same scroll logic (show after 300px) creates a consistent experience.
    // However, on PropertyDetails, the user might want to search immediately without scrolling down.
    // Let's stick to scroll logic for consistency, or standard FAB behavior.

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
            <Header />
            <main className="flex-grow">
                <Outlet />
            </main>

            {/* Global Search Bubble */}
            {(scrolled || location.pathname !== '/') && (
                <DraggableSearchBubble onClick={() => setShowSearchModal(true)} />
            )}

            <SearchModal
                isOpen={showSearchModal}
                onClose={() => setShowSearchModal(false)}
                onSearch={handleSearch}
                properties={properties}
                categories={CATEGORIES}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
            />

            <ChatWidget />
            <Footer />
        </div>
    );
}
