import React, { useState, useEffect } from 'react';
import { propertyAPI } from '../services/api';
import PropertyCard from '../components/PropertyCard';
import SearchBar from '../components/SearchBar';
import { motion } from 'framer-motion';
import { Loader2, MapPin } from 'lucide-react';

const Home = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeType, setActiveType] = useState('all');
  const [selectedCity, setSelectedCity] = useState(null);

  const cities = [
    { name: 'Mumbai', image: 'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?auto=format&fit=crop&w=800&q=80' },
    { name: 'Lonavala', image: 'https://images.unsplash.com/photo-1572376313042-ee7fdc96e330?auto=format&fit=crop&w=800&q=80' },
    { name: 'Goa', image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80' },
    { name: 'Alibaug', image: 'https://images.unsplash.com/photo-1596324683478-4c256f936119?auto=format&fit=crop&w=800&q=80' },
  ];

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async (searchParams = {}) => {
    try {
      setLoading(true);
      const response = await propertyAPI.getAll(searchParams);
      console.log('API Response:', response);
      window.debugResponse = response;
      setProperties(response || []);
    } catch (err) {
      setError('Failed to fetch properties');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchParams) => {
    fetchProperties({ ...searchParams, type: activeType !== 'all' ? activeType : undefined });
  };

  const handleTypeChange = (type) => {
    setActiveType(type);
    fetchProperties({ type: type !== 'all' ? type : undefined, city: selectedCity });
  };

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    fetchProperties({ city, type: activeType !== 'all' ? activeType : undefined });
  };

  const handleNearby = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        // In a real app, send lat/lng to backend. For now, we'll just simulate or search by a default nearby location
        // fetchProperties({ lat: position.coords.latitude, lng: position.coords.longitude });
        alert("Location found! (Backend integration for lat/lng pending)");
      });
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-[500px] md:h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
            alt="Luxury Resort"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight drop-shadow-lg"
          >
            Find your next <span className="text-rose-400">paradise</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-100 mb-10 max-w-2xl mx-auto drop-shadow-md"
          >
            Discover handpicked luxury villas, resorts, and private stays for your perfect getaway.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <SearchBar onSearch={handleSearch} />

            <div className="mt-8 flex justify-center gap-4">
              <button
                onClick={() => handleTypeChange('all')}
                className={`px-6 py-2 rounded-full backdrop-blur-md transition-all ${activeType === 'all' ? 'bg-white text-rose-500 font-bold' : 'bg-white/20 text-white hover:bg-white/30'}`}
              >
                All Stays
              </button>
              <button
                onClick={() => handleTypeChange('villa')}
                className={`px-6 py-2 rounded-full backdrop-blur-md transition-all ${activeType === 'villa' ? 'bg-white text-rose-500 font-bold' : 'bg-white/20 text-white hover:bg-white/30'}`}
              >
                Villas
              </button>
              <button
                onClick={() => handleTypeChange('waterpark')}
                className={`px-6 py-2 rounded-full backdrop-blur-md transition-all ${activeType === 'waterpark' ? 'bg-white text-rose-500 font-bold' : 'bg-white/20 text-white hover:bg-white/30'}`}
              >
                Water Parks
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Properties Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Featured Stays</h2>
            <p className="text-gray-500 mt-2">Explore our highest-rated properties</p>
          </div>
          <button onClick={handleNearby} className="flex items-center gap-2 text-rose-500 font-semibold hover:text-rose-600">
            <MapPin className="w-5 h-5" />
            Find Nearby
          </button>
        </div>

        {/* Cities/Locations Scroll */}
        <div className="mb-12">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Browse by Location</h3>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {cities.map((city) => (
              <div
                key={city.name}
                onClick={() => handleCitySelect(city.name)}
                className={`flex-shrink-0 relative w-64 h-40 rounded-xl overflow-hidden cursor-pointer transition-transform hover:scale-105 ${selectedCity === city.name ? 'ring-4 ring-rose-500' : ''}`}
              >
                <img src={city.image} alt={city.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20 hover:bg-black/10 transition-colors" />
                <span className="absolute bottom-3 left-3 text-white font-bold text-lg">{city.name}</span>
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-10 bg-red-50 rounded-xl">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {properties.map((property, index) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <PropertyCard property={property} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;