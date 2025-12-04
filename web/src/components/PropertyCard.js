import React from 'react';
import { MapPin, Star, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const PropertyCard = ({ property }) => {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Link to={`/properties/${property.id}`} className="block group relative">
                <div className="relative overflow-hidden rounded-xl aspect-[20/19] mb-3">
                    <img
                        src={property.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80'}
                        alt={property.title}
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute top-3 right-3">
                        <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
                            <Heart className="w-6 h-6 text-white fill-black/50 hover:fill-rose-500 hover:text-rose-500 transition-colors" />
                        </button>
                    </div>
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1 text-sm font-medium shadow-sm">
                        <span className="text-xs font-bold uppercase tracking-wider">Guest favorite</span>
                    </div>
                </div>

                <div className="space-y-1">
                    <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-base text-gray-900 truncate pr-4">{property.title}</h3>
                        <div className="flex items-center gap-1 text-sm">
                            <Star className="w-3 h-3 text-black fill-black" />
                            <span>{property.rating || 'New'}</span>
                        </div>
                    </div>

                    <div className="text-gray-500 text-sm truncate">
                        {property.location}
                    </div>

                    <div className="text-gray-500 text-sm">
                        Oct 22 - 27
                    </div>

                    <div className="flex items-baseline gap-1 mt-1">
                        <span className="font-semibold text-gray-900">₹{property.pricePerNight.toLocaleString()}</span>
                        <span className="text-gray-900">night</span>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

export default PropertyCard;
