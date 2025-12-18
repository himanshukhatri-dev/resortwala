import React, { useEffect, useState } from 'react';
import { useWishlist } from '../context/WishlistContext';
import PropertyCard from '../components/features/PropertyCard';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaHeart, FaArrowLeft } from 'react-icons/fa';

export default function Wishlist() {
    const { wishlist, isWishlisted } = useWishlist();
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
        }
    }, [user, authLoading, navigate]);

    useEffect(() => {
        const fetchWishlistedProperties = async () => {
            try {
                // If context has wishlist IDs, we might still need full property data.
                // Our API /customer/wishlist returns the full property objects.
                const token = localStorage.getItem('token');
                if (!token) return;

                const res = await fetch('/api/customer/wishlist', {
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

        if (user) {
            fetchWishlistedProperties();
        } else {
            setLoading(false);
        }
    }, [user]);

    // Handle removal from UI immediately if toggled off
    // However, PropertyCard handles toggle logic. 
    // If user untoggles in this list, we might want to remove it from the view.
    // The properties list won't auto-update unless we subscribe to wishlist context changes 
    // AND filter properties based on active wishlist context IDs.

    const visibleProperties = properties.filter(p => isWishlisted(p.PropertyId || p.id));

    if (authLoading || loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl min-h-screen">
            <div className="mb-6 flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <FaArrowLeft />
                </button>
                <h1 className="text-3xl font-bold font-serif text-gray-900 flex items-center gap-3">
                    <FaHeart className="text-red-500" /> Your Wishlist
                </h1>
            </div>

            {visibleProperties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {visibleProperties.map(property => (
                        <PropertyCard key={property.PropertyId || property.id} property={property} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                    <div className="bg-white p-6 rounded-full shadow-sm mb-4">
                        <FaHeart className="text-gray-300 text-4xl" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">No saved properties</h2>
                    <p className="text-gray-500 mb-6 max-w-md">
                        Start exploring and save your favorite villas and resorts to plan your perfect getaway.
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-8 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                    >
                        Explore Properties
                    </button>
                </div>
            )}
        </div>
    );
}
