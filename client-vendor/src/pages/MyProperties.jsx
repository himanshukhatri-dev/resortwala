import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useModal } from '../context/ModalContext';
import { FaPlus, FaSearch, FaMapMarkerAlt, FaBed, FaUsers, FaEdit, FaCalendarAlt, FaTrash, FaChartLine, FaEye, FaExternalLinkAlt } from 'react-icons/fa';
import Loader from '../components/Loader';

export default function MyProperties() {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const { showConfirm, showError, showSuccess } = useModal();
    const [properties, setProperties] = useState([]);
    const [filteredProperties, setFilteredProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchProperties();
    }, []);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredProperties(properties);
        } else {
            const term = searchTerm.toLowerCase();
            setFilteredProperties(properties.filter(p =>
                p.Name?.toLowerCase().includes(term) ||
                p.Location?.toLowerCase().includes(term)
            ));
        }
    }, [searchTerm, properties]);

    const fetchProperties = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/vendor/properties`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProperties(response.data);
            setFilteredProperties(response.data);
        } catch (err) {
            console.error('Error fetching properties:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await showConfirm(
            'Delete Property',
            'Are you sure you want to delete this property? This action cannot be undone.',
            'Delete',
            'Cancel',
            'danger'
        );

        if (!confirmed) return;

        try {
            await axios.delete(`${API_BASE_URL}/vendor/properties/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await showSuccess('Deleted', 'Property deleted successfully');
            fetchProperties();
        } catch (err) {
            showError('Error', 'Failed to delete property');
        }
    };

    if (loading) return <Loader />;

    return (
        <div className="max-w-6xl mx-auto pb-24 px-4 pt-6">

            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <div className="w-full md:w-auto">
                    <h1 className="text-2xl font-extrabold text-gray-900">My Properties</h1>
                    <p className="text-gray-500 text-sm">Manage listings & availability</p>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black outline-none transition text-sm font-medium"
                        />
                    </div>
                    {user?.is_approved ? (
                        <button
                            onClick={() => navigate('/properties/add')}
                            className="bg-black text-white px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gray-800 transition shadow-lg whitespace-nowrap"
                        >
                            <FaPlus /> <span className="hidden sm:inline">Add New</span>
                        </button>
                    ) : (
                        <div className="px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-xs font-bold whitespace-nowrap">
                            ⚠️ Pending Approval
                        </div>
                    )}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProperties.length > 0 ? (
                    filteredProperties.map(property => (
                        <div key={property.PropertyId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition group">

                            {/* Card Image Area */}
                            <div className="relative h-48 sm:h-56 overflow-hidden">
                                <img
                                    src={property.Image || 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=500'}
                                    alt={property.Name}
                                    className="w-full h-full object-cover transition duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                                <div className="absolute top-3 right-3 flex gap-2">
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-white shadow-sm ${property.is_approved ? 'bg-green-500' : 'bg-yellow-500'}`}>
                                        {property.is_approved ? 'Active' : 'Pending'}
                                    </span>
                                </div>

                                <div className="absolute bottom-3 left-4 text-white">
                                    <h3 className="text-lg font-bold leading-tight mb-0.5">{property.Name}</h3>
                                    <div className="flex items-center gap-1 text-xs opacity-90">
                                        <FaMapMarkerAlt /> {property.Location}
                                    </div>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-4">
                                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-50">
                                    <div className="text-gray-900">
                                        <span className="text-xl font-extrabold">₹{Math.round(property.Price).toLocaleString()}</span>
                                        <span className="text-xs text-gray-500 font-medium ml-1">/ night</span>
                                    </div>
                                    <div className="flex gap-3 text-xs font-medium text-gray-500">
                                        <span className="flex items-center gap-1"><FaUsers /> {property.MaxGuest}</span>
                                        <span className="flex items-center gap-1"><FaBed /> {property.Bedrooms}</span>
                                    </div>
                                </div>

                                {/* Booking Stats Compact */}
                                {property.upcoming_bookings_count > 0 && (
                                    <div className="bg-blue-50 text-blue-800 px-3 py-2 rounded-lg text-xs font-bold mb-4 flex items-center justify-between">
                                        <span className="flex items-center gap-1.5"><FaChartLine /> Upcoming Bookings</span>
                                        <span className="bg-white px-2 py-0.5 rounded text-blue-600 shadow-sm">{property.upcoming_bookings_count}</span>
                                    </div>
                                )}

                                {/* Action Buttons Grid */}
                                <div className="grid grid-cols-4 gap-2">
                                    <button
                                        onClick={() => window.open(`http://72.61.242.42/property/${property.PropertyId}`, '_blank')}
                                        className="col-span-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg py-2.5 flex items-center justify-center transition"
                                        title="View Live Listing"
                                    >
                                        <FaExternalLinkAlt size={14} />
                                    </button>

                                    <button
                                        onClick={() => navigate(`/properties/edit/${property.PropertyId}`)}
                                        className="col-span-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg py-2.5 flex items-center justify-center transition"
                                        title="Edit Property"
                                    >
                                        <FaEdit size={16} />
                                    </button>

                                    <button
                                        onClick={() => navigate(`/properties/${property.PropertyId}/calendar`)}
                                        className="col-span-2 bg-[#FF385C] hover:bg-[#D90B3E] text-white rounded-lg py-2.5 flex items-center justify-center gap-2 font-bold text-sm transition shadow-md hover:shadow-lg"
                                        title="Manage Calendar"
                                    >
                                        <FaCalendarAlt /> Calendar
                                    </button>
                                </div>
                                {/* <div className="mt-2 text-center">
                                    <button
                                        onClick={() => handleDelete(property.PropertyId)}
                                        className="text-xs text-red-400 hover:text-red-600 font-medium py-1 px-2 transition"
                                    >
                                        Delete Property
                                    </button>
                                </div> */}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                            <FaSearch className="text-gray-300 text-xl" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">No properties found</h3>
                        <p className="text-gray-500 text-sm mt-1">Try adjusting your search or add a new property.</p>
                        {!searchTerm && user?.is_approved && (
                            <button onClick={() => navigate('/properties/add')} className="mt-4 text-black font-bold text-sm hover:underline"> Create New Listing </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
