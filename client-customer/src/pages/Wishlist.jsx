import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { useWishlist } from '../context/WishlistContext';
import PropertyCard from '../components/features/PropertyCard';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaHeart, FaArrowLeft, FaRegCompass, FaSadTear } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

export default function Wishlist() {
    const { wishlist } = useWishlist();
    const { user, token, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchWishlistedProperties = async () => {
        setLoading(true);
        try {
            if (!token) {
                setLoading(false);
                return;
            };

            const res = await fetch(`${API_BASE_URL}/customer/wishlist`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setProperties(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Failed to fetch wishlist properties", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
        }
    }, [user, authLoading, navigate]);

    useEffect(() => {
        if (user && token) {
            fetchWishlistedProperties();
        } else if (!authLoading) {
            setLoading(false);
        }
    }, [user, token, authLoading]);

    // Force refresh if wishlist context changes significantly (length check as proxy)
    useEffect(() => {
        if (properties.length !== wishlist.length && !loading && user) {
            fetchWishlistedProperties();
        }
    }, [wishlist.length]);

    // Skeleton Loader Component
    const PropertySkeleton = () => (
        <div className="bg-white rounded-[1.5rem] border border-gray-100 p-3 flex flex-col gap-4 animate-pulse h-full">
            <div className="bg-gray-200 rounded-[1.2rem] h-[250px] w-full"></div>
            <div className="flex-1 space-y-3 px-1">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="flex gap-2 pt-2">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-10 bg-gray-200 rounded-xl w-full mt-4"></div>
            </div>
        </div>
    );

    // Filter visible properties to ensure we don't show items that were just removed in context
    // (Optional: depending on if we want instant removal or wait for refresh)
    const visibleProperties = properties.filter(p => wishlist.includes(p.PropertyId || p.id));

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 pt-24 md:pt-28">
            <div className="container mx-auto px-4 max-w-7xl">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                    <div>
                        <motion.button
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            onClick={() => navigate(-1)}
                            className="inline-flex items-center gap-2 text-gray-500 hover:text-black mb-4 transition-colors text-sm font-medium"
                        >
                            <FaArrowLeft /> Back
                        </motion.button>
                        <motion.h1
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="text-3xl md:text-5xl font-bold font-serif text-gray-900 mb-2"
                        >
                            Your Wishlist
                        </motion.h1>
                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-gray-500 text-lg"
                        >
                            {loading ? "Loading your saved gems..." : `${visibleProperties.length} saved ${visibleProperties.length === 1 ? 'property' : 'properties'} for your next getaway`}
                        </motion.p>
                    </div>
                </div>

                {/* Content Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(n => <PropertySkeleton key={n} />)}
                    </div>
                ) : visibleProperties.length > 0 ? (
                    <motion.div
                        initial="hidden"
                        animate="show"
                        variants={{
                            hidden: { opacity: 0 },
                            show: {
                                opacity: 1,
                                transition: { staggerChildren: 0.1 }
                            }
                        }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    >
                        <AnimatePresence>
                            {visibleProperties.map(property => (
                                <motion.div
                                    key={property.PropertyId || property.id}
                                    variants={{
                                        hidden: { opacity: 0, y: 20 },
                                        show: { opacity: 1, y: 0 }
                                    }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    layout
                                >
                                    <PropertyCard property={property} cardType="vertical" />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                ) : (
                    /* Empty State */
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-20 text-center"
                    >
                        <div className="bg-white p-8 rounded-full shadow-sm mb-6 relative">
                            <div className="absolute inset-0 bg-red-50 rounded-full animate-ping opacity-75"></div>
                            <FaHeart className="text-red-500 text-5xl relative z-10" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-3 font-serif">No saved properties yet</h2>
                        <p className="text-gray-500 mb-8 max-w-md text-lg leading-relaxed">
                            Your wishlist is waiting for some love. Explore our curated collection of luxury villas and resorts.
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-black text-white rounded-full font-bold text-lg hover:bg-gray-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 active:translate-y-0"
                        >
                            <FaRegCompass className="group-hover:rotate-45 transition-transform" />
                            Start Exploring
                        </button>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

