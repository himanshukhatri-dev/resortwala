import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext'; // Assuming context availability
import { API_BASE_URL } from '../config';
import { FaUser, FaBuilding, FaMapMarkerAlt, FaTag, FaImage, FaArrowRight, FaArrowLeft, FaCheck } from 'react-icons/fa';
import Loader from '../components/Loader';

export default function AddProperty() {
    const navigate = useNavigate();
    const { token } = useAuth();
    const { showSuccess, showError } = useModal(); // Or simplified equivalent if not available
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Data States
    const [vendors, setVendors] = useState([]);
    const [loadingVendors, setLoadingVendors] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [selectedVendor, setSelectedVendor] = useState(null);
    const [formData, setFormData] = useState({
        Name: '',
        PropertyType: 'Villa',
        Price: '',
        Location: '',
        description: '',
    });
    const [images, setImages] = useState([]);

    // Fetch Vendors on Step 1 load
    useEffect(() => {
        if (step === 1) {
            fetchVendors();
        }
    }, [step]);

    const fetchVendors = async () => {
        setLoadingVendors(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/vendors`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setVendors(res.data);
        } catch (err) {
            console.error(err);
            // handle error
        } finally {
            setLoadingVendors(false);
        }
    };

    const handleImageChange = (e) => {
        if (e.target.files) {
            setImages(Array.from(e.target.files));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedVendor) return alert("Please select a vendor first.");

        setLoading(true);
        const payload = new FormData();
        payload.append('vendor_id', selectedVendor.id);
        payload.append('Name', formData.Name);
        payload.append('PropertyType', formData.PropertyType);
        payload.append('Price', formData.Price);
        payload.append('Location', formData.Location);
        payload.append('description', formData.description);

        images.forEach((img) => {
            payload.append('images[]', img);
        });

        try {
            await axios.post(`${API_BASE_URL}/admin/properties`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            // Simplified Success Handling
            alert("Property Created Successfully!");
            navigate('/properties');
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || "Failed to create property";
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    // Filter Vendors
    const filteredVendors = vendors.filter(v =>
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.business_name && v.business_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-12">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button onClick={() => navigate('/properties')} className="text-gray-500 hover:text-gray-800 text-sm mb-2">&larr; Back to Properties</button>
                    <h1 className="text-3xl font-bold text-gray-900">Add New Property</h1>
                    <p className="text-gray-500">Onboard a property directly for a vendor.</p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center gap-4 mb-8">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${step === 1 ? 'bg-blue-600 text-white' : 'bg-green-100 text-green-700'}`}>
                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">1</div>
                        Select Vendor
                    </div>
                    <div className="w-8 h-px bg-gray-300"></div>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${step === 2 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">2</div>
                        Property Details
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">

                    {/* STEP 1: VENDOR SELECTION */}
                    {step === 1 && (
                        <div className="p-8">
                            <h2 className="text-xl font-bold mb-4">Who is the owner?</h2>
                            <div className="mb-6 relative">
                                <input
                                    type="text"
                                    placeholder="Search by name, email, or business..."
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none pl-10"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>

                            {loadingVendors ? (
                                <Loader message="Loading Vendors..." />
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
                                    {filteredVendors.map(vendor => (
                                        <div
                                            key={vendor.id}
                                            onClick={() => setSelectedVendor(vendor)}
                                            className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md flex items-center gap-4 ${selectedVendor?.id === vendor.id ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-100 hover:border-blue-200'}`}
                                        >
                                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-lg">
                                                {vendor.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900">{vendor.business_name || vendor.name}</h3>
                                                <p className="text-sm text-gray-500">{vendor.email}</p>
                                                <p className="text-xs text-gray-400 mt-1">{vendor.phone}</p>
                                            </div>
                                            {selectedVendor?.id === vendor.id && <FaCheck className="ml-auto text-blue-600" />}
                                        </div>
                                    ))}
                                    {filteredVendors.length === 0 && (
                                        <div className="col-span-2 text-center py-12 text-gray-400">
                                            No vendors found. <button className="text-blue-600 hover:underline">Create New Vendor</button> (Go to Users users first)
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="mt-8 flex justify-end">
                                <button
                                    disabled={!selectedVendor}
                                    onClick={() => setStep(2)}
                                    className="px-8 py-3 bg-blue-600 disabled:bg-gray-300 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all"
                                >
                                    Next Step <FaArrowRight />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: PROPERTY FORM */}
                    {step === 2 && (
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold">Property Details</h2>
                                <div className="text-sm px-3 py-1 bg-blue-50 text-blue-700 rounded-lg font-medium border border-blue-100">
                                    Owner: <b>{selectedVendor?.name}</b>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Property Name</label>
                                        <div className="relative">
                                            <FaBuilding className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                required
                                                type="text"
                                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={formData.Name}
                                                onChange={e => setFormData({ ...formData, Name: e.target.value })}
                                                placeholder="e.g. Sunset Villa"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Location</label>
                                        <div className="relative">
                                            <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={formData.Location}
                                                onChange={e => setFormData({ ...formData, Location: e.target.value })}
                                                placeholder="e.g. Lonavala, Maharashtra"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Base Price (Per Night)</label>
                                        <div className="relative">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</div>
                                            <input
                                                required
                                                type="number"
                                                className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={formData.Price}
                                                onChange={e => setFormData({ ...formData, Price: e.target.value })}
                                                placeholder="5000"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Type</label>
                                        <div className="relative">
                                            <FaTag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <select
                                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white"
                                                value={formData.PropertyType}
                                                onChange={e => setFormData({ ...formData, PropertyType: e.target.value })}
                                            >
                                                <option value="Villa">Villa</option>
                                                <option value="Resort">Resort</option>
                                                <option value="Hotel">Hotel</option>
                                                <option value="Waterpark">Waterpark</option>
                                                <option value="Farmhouse">Farmhouse</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                                    <textarea
                                        rows="4"
                                        className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Describe the property..."
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Photos</label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 hover:bg-white transition-colors cursor-pointer relative">
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                        />
                                        <FaImage className="mx-auto text-4xl text-gray-300 mb-2" />
                                        <p className="font-medium text-gray-600">Click to upload photos</p>
                                        <p className="text-xs text-gray-400">Supports JPG, PNG</p>
                                    </div>
                                    {images.length > 0 && (
                                        <div className="mt-4 flex gap-2 flex-wrap">
                                            {images.map((img, i) => (
                                                <div key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-100 flex items-center gap-2">
                                                    {img.name}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-4 pt-6 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-200 transition-all"
                                    >
                                        <FaArrowLeft /> Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 px-8 py-3 bg-green-600 disabled:bg-gray-400 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-all shadow-lg shadow-green-600/20"
                                    >
                                        {loading ? <Loader size="sm" color="white" /> : <><FaCheck /> Create Property</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Simple internal icon for Search if not imported
function FaSearch(props) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5A6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5S14 7.01 14 9.5S11.99 14 9.5 14z" /></svg>;
}
