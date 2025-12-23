import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import { useModal } from '../context/ModalContext';
import { API_BASE_URL } from '../config';
import { FaCheck, FaTimes, FaEdit, FaTrash, FaMapMarkerAlt, FaUser, FaPhone, FaBuilding, FaSearch, FaFilter } from 'react-icons/fa';

export default function Properties() {
    const navigate = useNavigate();
    const { token } = useAuth();
    const { showConfirm, showSuccess, showError } = useModal();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [filter, setFilter] = useState('all'); // all, approved, pending, rejected
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/admin/properties`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProperties(response.data);
        } catch (error) {
            console.error('Error fetching properties:', error);
            showError('Error', 'Failed to fetch properties');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        // ... (This function is likely unused here since approval happens on detail page, but keeping for completeness if needed)
        navigate(`/properties/${id}/approve`);
    };

    const handleReject = async (id) => {
        const confirmed = await showConfirm(
            'Reject Property',
            'Are you sure you want to reject this property? This will delete it permanently.',
            'Reject & Delete',
            'Cancel',
            'danger'
        );

        if (!confirmed) return;

        setActionLoading(true);
        try {
            await axios.delete(`${API_BASE_URL}/admin/properties/${id}/reject`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProperties(properties.filter(p => p.PropertyId !== id));
            showSuccess('Rejected', 'Property rejected and deleted successfully');
        } catch (error) {
            console.error('Error rejecting property:', error);
            showError('Error', 'Failed to reject property');
        } finally {
            setActionLoading(false);
        }
    };

    const filteredProperties = properties.filter(property => {
        const matchesFilter =
            filter === 'all' ? true :
                filter === 'approved' ? property.is_approved == 1 :
                    filter === 'pending' ? !property.is_approved : true;

        const matchesSearch =
            property.Name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            property.Location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            property.vendor?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            property.vendor?.business_name?.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    if (loading) return <Loader message="Loading Properties..." />;

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header Stats / Title */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Properties</h1>
                        <p className="text-gray-500 mt-1">Manage all registered properties and approvals</p>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 flex gap-4 text-sm font-medium">
                        <div className="text-center">
                            <span className="block text-xl font-bold text-gray-800">{properties.length}</span>
                            <span className="text-gray-500">Total</span>
                        </div>
                        <div className="w-px bg-gray-200"></div>
                        <div className="text-center">
                            <span className="block text-xl font-bold text-green-600">{properties.filter(p => p.is_approved).length}</span>
                            <span className="text-gray-500">Active</span>
                        </div>
                        <div className="w-px bg-gray-200"></div>
                        <div className="text-center">
                            <span className="block text-xl font-bold text-amber-500">{properties.filter(p => !p.is_approved).length}</span>
                            <span className="text-gray-500">Pending</span>
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col md:flex-row gap-4 justify-between items-center">

                    {/* Tabs */}
                    <div className="flex bg-gray-100 p-1 rounded-lg w-full md:w-auto">
                        {['all', 'pending', 'approved'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`flex-1 md:flex-none px-6 py-2 rounded-md text-sm font-medium transition-all ${filter === f
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    } capitalize`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative w-full md:w-96">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search properties, locations, vendors..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {filteredProperties.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            <FaBuilding className="mx-auto text-4xl text-gray-300 mb-3" />
                            <p>No properties found matching your criteria.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        <th className="px-6 py-4">Property Details</th>
                                        <th className="px-6 py-4">Vendor Info</th>
                                        <th className="px-6 py-4 text-center">Price / Night</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredProperties.map(property => (
                                        <tr key={property.PropertyId} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-16 h-16 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0 border border-gray-100 relative">
                                                        {property.primary_image ? (
                                                            <img
                                                                src={property.primary_image.image_path} // Ensure this path is full logic handled in Controller
                                                                alt={property.Name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                                <FaBuilding />
                                                            </div>
                                                        )}
                                                        <div className="absolute top-0 right-0 bg-black/50 text-white text-[10px] px-1 rounded-bl">
                                                            ID: {property.PropertyId}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-gray-800 text-base">{property.Name}</h3>
                                                        <div className="flex items-center text-gray-500 text-sm mt-1 gap-1">
                                                            <FaMapMarkerAlt className="text-xs text-red-400" />
                                                            {property.Location || 'Unknown Location'}
                                                        </div>
                                                        <div className="text-xs text-gray-400 mt-1 capitalize">
                                                            {property.PropertyType || 'Villa'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="font-medium text-gray-800 flex items-center gap-2">
                                                        <FaUser className="text-gray-300 text-xs" />
                                                        {property.vendor?.business_name || property.vendor?.name || 'Unassigned'}
                                                    </div>
                                                    <div className="text-sm text-gray-500">{property.vendor?.email}</div>
                                                    {property.vendor?.phone && (
                                                        <div className="text-xs text-gray-400 flex items-center gap-1">
                                                            <FaPhone className="text-[10px]" /> {property.vendor.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="font-bold text-gray-800">
                                                    ₹{parseInt(property.Price).toLocaleString()}
                                                </div>
                                                <div className="text-xs text-gray-400">Base Rate</div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${property.is_approved
                                                    ? 'bg-green-50 text-green-700 border-green-100'
                                                    : 'bg-amber-50 text-amber-700 border-amber-100'
                                                    }`}>
                                                    {property.is_approved ? <FaCheck className="text-[10px]" /> : <FaFilter className="text-[10px]" />}
                                                    {property.is_approved ? 'Approved' : 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => navigate(`/properties/${property.PropertyId}/approve`)}
                                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${property.is_approved
                                                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                                            : 'bg-green-100 text-green-700 hover:bg-green-200 shadow-sm ring-1 ring-green-200'
                                                            }`}
                                                    >
                                                        {property.is_approved ? (
                                                            <>
                                                                <FaEdit /> Pricing
                                                            </>
                                                        ) : (
                                                            <>
                                                                <FaCheck /> Approve
                                                            </>
                                                        )}
                                                    </button>

                                                    <button
                                                        onClick={() => handleReject(property.PropertyId)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                                        title="Delete Property"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
