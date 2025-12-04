import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import BookingForm from '../components/BookingForm';
import { MapPin, Wifi, Share2 } from 'lucide-react';
import { propertyAPI, bookingAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const PropertyDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showShareMenu, setShowShareMenu] = useState(false);

    useEffect(() => {
        // Fetch property details
        const fetchProperty = async () => {
            try {
                const data = await propertyAPI.getById(id);
                setProperty(data);
            } catch (error) {
                console.error('Error fetching property:', error);
                toast.error('Failed to load property details');
            } finally {
                setLoading(false);
            }
        };

        fetchProperty();
    }, [id]);

    // Close share menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showShareMenu && !event.target.closest('.share-menu-container')) {
                setShowShareMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showShareMenu]);

    const handleBooking = async (bookingData) => {
        if (!user) {
            toast.error('Please login to book a property');
            navigate('/login', { state: { from: `/properties/${id}` } });
            return;
        }

        try {
            await bookingAPI.create({
                propertyId: id,
                checkInDate: bookingData.checkIn,
                checkOutDate: bookingData.checkOut,
                guests: bookingData.guests
            });
            toast.success('Booking confirmed successfully!');
            navigate('/bookings');
        } catch (error) {
            console.error('Booking error:', error);
            toast.error(error.response?.data?.error || 'Failed to create booking');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading property details...</p>
                </div>
            </div>
        );
    }

    if (!property) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center max-w-md mx-auto px-4">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Not Found</h2>
                    <p className="text-gray-600 mb-6">The property you're looking for doesn't exist or has been removed.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
            {/* Title and Location */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">{property.title}</h1>
                    <div className="relative share-menu-container">
                        <button
                            onClick={() => setShowShareMenu(!showShareMenu)}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <Share2 className="w-5 h-5" />
                            <span className="font-medium">Share</span>
                        </button>

                        {showShareMenu && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                                <div className="py-2">
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(window.location.href);
                                            toast.success('Link copied to clipboard!');
                                            setShowShareMenu(false);
                                        }}
                                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                                    >
                                        <span>📋</span>
                                        <span>Copy link</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            window.open(`https://wa.me/?text=Check out this property: ${window.location.href}`, '_blank');
                                            setShowShareMenu(false);
                                        }}
                                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                                    >
                                        <span>💬</span>
                                        <span>Share on WhatsApp</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            window.open(`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`, '_blank');
                                            setShowShareMenu(false);
                                        }}
                                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                                    >
                                        <span>📘</span>
                                        <span>Share on Facebook</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            window.open(`https://twitter.com/intent/tweet?url=${window.location.href}&text=Check out this property!`, '_blank');
                                            setShowShareMenu(false);
                                        }}
                                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                                    >
                                        <span>🐦</span>
                                        <span>Share on Twitter</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-5 h-5" />
                    <span>{property.location}</span>
                </div>
            </div>

            {/* Image Gallery (Simplified) */}
            <div className="rounded-2xl overflow-hidden aspect-[2/1] mb-8 relative">
                <img
                    src={property.images?.[0] || 'https://via.placeholder.com/1200x600?text=No+Image'}
                    alt={property.title}
                    className="w-full h-full object-cover"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Description */}
                    <div>
                        <h2 className="text-2xl font-semibold mb-4">About this place</h2>
                        <p className="text-gray-600 leading-relaxed">{property.description}</p>
                    </div>

                    {/* Amenities */}
                    <div className="border-t border-gray-200 pt-8">
                        <h2 className="text-2xl font-semibold mb-4">What this place offers</h2>
                        <div className="grid grid-cols-2 gap-4">
                            {property.amenities?.map((amenity, index) => (
                                <div key={index} className="flex items-center gap-3 text-gray-600">
                                    {/* You might want to map specific icons based on amenity name */}
                                    <Wifi className="w-6 h-6" />
                                    <span>{amenity}</span>
                                </div>
                            ))}
                            {(!property.amenities || property.amenities.length === 0) && (
                                <p className="text-gray-500">No specific amenities listed.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Booking Sidebar */}
                <div>
                    <BookingForm property={property} onBook={handleBooking} />
                </div>
            </div>
        </div>
    );
};

export default PropertyDetails;
