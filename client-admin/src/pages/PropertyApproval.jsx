import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

export default function PropertyApproval() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('basic'); // 'basic' | 'pricing' | 'media' | 'rules'

    // Editable state for the property details
    const [formData, setFormData] = useState({});

    const [pricing, setPricing] = useState({
        mon_thu: {
            villa: { current: 0, discounted: 0, final: 0 },
            extra_person: { current: 0, discounted: 0, final: 0 },
            meal_person: { current: 0, discounted: 0, final: 0 }
        },
        fri_sun: {
            villa: { current: 0, discounted: 0, final: 0 },
            extra_person: { current: 0, discounted: 0, final: 0 },
            meal_person: { current: 0, discounted: 0, final: 0 }
        },
        sat: {
            villa: { current: 0, discounted: 0, final: 0 },
            extra_person: { current: 0, discounted: 0, final: 0 },
            meal_person: { current: 0, discounted: 0, final: 0 }
        }
    });

    useEffect(() => {
        const fetchProperty = async () => {
            try {
                // Token is available from useAuth
                const res = await axios.get(`${API_BASE_URL}/admin/properties/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProperty(res.data);
                setFormData({
                    Name: res.data.Name || '',
                    Location: res.data.Location || '',
                    LongDescription: res.data.LongDescription || '',
                    Occupancy: res.data.Occupancy || 0,
                    NoofRooms: res.data.NoofRooms || 0,
                    checkInTime: res.data.checkInTime || '',
                    checkOutTime: res.data.checkOutTime || '',
                    PropertyRules: res.data.PropertyRules || '',
                    BookingSpecailMessage: res.data.BookingSpecailMessage || '',
                });
                initializePricing(res.data);
            } catch (err) {
                console.error(err);
                alert("Failed to load property");
            } finally {
                setLoading(false);
            }
        };
        fetchProperty();
    }, [id]);

    const initializePricing = (prop) => {
        try {
            // Init logic to populate "Current" from property data
            // And "Final" from existing admin_pricing if present

            const existing = prop.admin_pricing || {};
            const getVal = (day, type, field, fallback) => existing[day]?.[type]?.[field] ?? fallback;

            // Helper to grab vendor prices (Current)
            // Mon-Thu
            const mt_villa = parseFloat(prop.price_mon_thu || prop.Price || 0);

            // Safely access onboarding data
            const ob = prop.onboarding_data || {};
            const pricingData = ob.pricing || {};

            // Extra Guest Charges (Handle both new flat structure and old nested structure)
            let mt_extra = 0;
            let fs_extra = 0;
            let sat_extra = 0;

            if (ob.extraGuestPriceMonThu) {
                // New Format (Root level in onboarding_data)
                mt_extra = parseFloat(ob.extraGuestPriceMonThu || 0);
                fs_extra = parseFloat(ob.extraGuestPriceFriSun || 0);
                sat_extra = parseFloat(ob.extraGuestPriceSaturday || 0);
            } else if (pricingData.extraGuestCharge) {
                // Old/Nested Format
                if (typeof pricingData.extraGuestCharge === 'object') {
                    mt_extra = parseFloat(pricingData.extraGuestCharge.week || pricingData.extraGuestCharge.weekday || 0);
                    fs_extra = parseFloat(pricingData.extraGuestCharge.weekend || 0);
                    sat_extra = parseFloat(pricingData.extraGuestCharge.saturday || 0);
                } else {
                    const val = parseFloat(pricingData.extraGuestCharge || 0);
                    mt_extra = val;
                    fs_extra = val;
                    sat_extra = val;
                }
            }

            // Food Rates
            const foodRates = ob.foodRates || {};
            // Default to Veg rate, fallback to NonVeg or Jain
            const mt_meal = parseFloat(foodRates.veg || foodRates.nonVeg || foodRates.jain || 0);

            // Fri-Sun
            const fs_villa = parseFloat(prop.price_fri_sun || 0);

            // Sat
            const sat_villa = parseFloat(prop.price_sat || 0);

            setPricing({
                mon_thu: {
                    villa: {
                        current: mt_villa,
                        discounted: getVal('mon_thu', 'villa', 'discounted', mt_villa),
                        final: getVal('mon_thu', 'villa', 'final', mt_villa)
                    },
                    extra_person: {
                        current: mt_extra,
                        discounted: getVal('mon_thu', 'extra_person', 'discounted', mt_extra),
                        final: getVal('mon_thu', 'extra_person', 'final', mt_extra)
                    },
                    meal_person: {
                        current: mt_meal,
                        discounted: getVal('mon_thu', 'meal_person', 'discounted', mt_meal),
                        final: getVal('mon_thu', 'meal_person', 'final', mt_meal)
                    }
                },
                fri_sun: {
                    villa: {
                        current: fs_villa,
                        discounted: getVal('fri_sun', 'villa', 'discounted', fs_villa),
                        final: getVal('fri_sun', 'villa', 'final', fs_villa)
                    },
                    extra_person: {
                        current: fs_extra,
                        discounted: getVal('fri_sun', 'extra_person', 'discounted', fs_extra),
                        final: getVal('fri_sun', 'extra_person', 'final', fs_extra)
                    },
                    meal_person: {
                        current: mt_meal,
                        discounted: getVal('fri_sun', 'meal_person', 'discounted', mt_meal),
                        final: getVal('fri_sun', 'meal_person', 'final', mt_meal)
                    }
                },
                sat: {
                    villa: {
                        current: sat_villa,
                        discounted: getVal('sat', 'villa', 'discounted', sat_villa),
                        final: getVal('sat', 'villa', 'final', sat_villa)
                    },
                    extra_person: {
                        current: sat_extra,
                        discounted: getVal('sat', 'extra_person', 'discounted', sat_extra),
                        final: getVal('sat', 'extra_person', 'final', sat_extra)
                    },
                    meal_person: {
                        current: mt_meal,
                        discounted: getVal('sat', 'meal_person', 'discounted', mt_meal),
                        final: getVal('sat', 'meal_person', 'final', mt_meal)
                    }
                }
            });
        } catch (e) {
            console.error("Error initializing pricing:", e);
            // Don't crash, just show empty defaults or alert
        }
    };

    const handlePriceChange = (day, type, field, value) => {
        setPricing(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                [type]: {
                    ...prev[day][type],
                    [field]: parseFloat(value) || 0
                }
            }
        }));
    };

    const handleApprove = async () => {
        setSaving(true);
        try {
            await axios.put(`${API_BASE_URL}/admin/properties/${id}/approve`, {
                ...formData, // Send updated fields
                admin_pricing: pricing
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Property Approved and Saved!');
            navigate('/admin/properties');
        } catch (err) {
            console.error(err);
            alert('Failed to approve property');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;
    if (!property) return <div className="p-8 text-red-500">Property not found.</div>;

    const renderPriceRow = (label, day, type) => (
        <tr className="border-b">
            <td className="p-3 font-medium">{label}</td>
            <td className="p-3 bg-gray-50">{pricing[day][type].current}</td>
            <td className="p-3">
                <input
                    type="number"
                    className="border p-2 rounded w-32"
                    value={pricing[day][type].discounted}
                    onChange={(e) => handlePriceChange(day, type, 'discounted', e.target.value)}
                />
            </td>
            <td className="p-3">
                <input
                    type="number"
                    className="border p-2 rounded w-32 font-bold text-green-700"
                    value={pricing[day][type].final}
                    onChange={(e) => handlePriceChange(day, type, 'final', e.target.value)}
                />
            </td>
        </tr>
    );

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen pb-20">
            <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="p-6 bg-white border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 leading-tight">Review: {property.Name}</h1>
                        <p className="text-gray-500 text-sm mt-1">Vendor: <span className="font-bold text-blue-600">{property.vendor?.business_name || property.vendor?.name}</span></p>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button
                            onClick={() => navigate('/admin/properties')}
                            className="flex-1 md:flex-none px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleApprove}
                            disabled={saving}
                            className="flex-1 md:flex-none bg-green-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-200 transition disabled:opacity-50"
                        >
                            {saving ? 'Processing...' : 'Approve & Go Live'}
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex overflow-x-auto bg-gray-50 px-4 border-b">
                    {[
                        { id: 'basic', label: 'Basic Info', icon: '📝' },
                        { id: 'pricing', label: 'Pricing Matrix', icon: '💰' },
                        { id: 'media', label: 'Photos & Media', icon: '🖼️' },
                        { id: 'rules', label: 'Rules & Policy', icon: '📜' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${activeTab === tab.id ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            <span>{tab.icon}</span> {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-6 md:p-8">
                    {/* Basic Info Tab */}
                    {activeTab === 'basic' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Property Name</label>
                                    <input
                                        type="text"
                                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none transition font-medium"
                                        value={formData.Name}
                                        onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Location / City</label>
                                    <input
                                        type="text"
                                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none transition font-medium"
                                        value={formData.Location}
                                        onChange={(e) => setFormData({ ...formData, Location: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Description</label>
                                <textarea
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none transition min-h-[150px]"
                                    value={formData.LongDescription}
                                    onChange={(e) => setFormData({ ...formData, LongDescription: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Occupancy</label>
                                    <input
                                        type="number"
                                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none transition"
                                        value={formData.Occupancy}
                                        onChange={(e) => setFormData({ ...formData, Occupancy: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Rooms</label>
                                    <input
                                        type="number"
                                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none transition"
                                        value={formData.NoofRooms}
                                        onChange={(e) => setFormData({ ...formData, NoofRooms: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Check-In</label>
                                    <input
                                        type="text"
                                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none transition"
                                        value={formData.checkInTime}
                                        onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Check-Out</label>
                                    <input
                                        type="text"
                                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none transition"
                                        value={formData.checkOutTime}
                                        onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Pricing Tab */}
                    {activeTab === 'pricing' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {['mon_thu', 'fri_sun', 'sat'].map((day) => {
                                const titles = { mon_thu: 'Monday to Thursday', fri_sun: 'Friday & Sunday', sat: 'Saturday' };
                                const colors = { mon_thu: 'blue', fri_sun: 'purple', sat: 'orange' };
                                const color = colors[day];

                                return (
                                    <div key={day} className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                                        <div className={`bg-${color}-50 px-6 py-4 border-b border-${color}-100 flex items-center gap-3`}>
                                            <span className={`w-3 h-3 rounded-full bg-${color}-500 animate-pulse`}></span>
                                            <h3 className={`font-black text-sm uppercase tracking-widest text-${color}-800`}>{titles[day]}</h3>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50">
                                                    <tr>
                                                        <th className="px-6 py-3">Service Type</th>
                                                        <th className="px-6 py-3">Vendor Ask</th>
                                                        <th className="px-6 py-3">Our Discounted</th>
                                                        <th className="px-6 py-3 text-right">Final Customer Price</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {[
                                                        { label: 'Villa Base Price', type: 'villa' },
                                                        { label: 'Extra Person', type: 'extra_person' },
                                                        { label: 'Meal per Person', type: 'meal_person' }
                                                    ].map((item) => (
                                                        <tr key={item.type} className="hover:bg-gray-50/50 transition">
                                                            <td className="px-6 py-4 font-bold text-gray-700">{item.label}</td>
                                                            <td className="px-6 py-4 text-gray-400 font-medium">₹{pricing[day][item.type].current}</td>
                                                            <td className="px-6 py-4">
                                                                <input
                                                                    type="number"
                                                                    className="w-28 p-2 bg-gray-50 border border-gray-100 rounded-lg outline-none focus:border-blue-300 transition text-sm"
                                                                    value={pricing[day][item.type].discounted}
                                                                    onChange={(e) => handlePriceChange(day, item.type, 'discounted', e.target.value)}
                                                                />
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <input
                                                                    type="number"
                                                                    className="w-28 p-2 bg-blue-50 border border-blue-100 rounded-lg outline-none focus:ring-2 focus:ring-blue-200 transition text-sm font-black text-blue-700 text-right"
                                                                    value={pricing[day][item.type].final}
                                                                    onChange={(e) => handlePriceChange(day, item.type, 'final', e.target.value)}
                                                                />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Media Tab */}
                    {activeTab === 'media' && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {property.images?.length > 0 ? (
                                property.images.map(img => (
                                    <div key={img.id} className="relative group aspect-square rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                                        <img
                                            src={img.image_url}
                                            alt="Property"
                                            className="w-full h-full object-cover transition duration-500 group-hover:scale-110"
                                        />
                                        {img.is_primary && (
                                            <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter">Cover Photo</div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-4 p-20 text-center border-2 border-dashed border-gray-100 rounded-3xl text-gray-400">
                                    No images uploaded yet
                                </div>
                            )}
                        </div>
                    )}

                    {/* Rules Tab */}
                    {activeTab === 'rules' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Property Rules & Policy</label>
                                <textarea
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none transition min-h-[250px]"
                                    value={formData.PropertyRules}
                                    onChange={(e) => setFormData({ ...formData, PropertyRules: e.target.value })}
                                    placeholder="Enter basic house rules, cancellation policy, etc."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Booking Special Message</label>
                                <textarea
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none transition min-h-[100px]"
                                    value={formData.BookingSpecailMessage}
                                    onChange={(e) => setFormData({ ...formData, BookingSpecailMessage: e.target.value })}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Warning for unapproved */}
            {!property.is_approved && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
                    <span className="text-xl">⚠️</span>
                    <span className="font-bold text-sm">Property is currently Hidden (Pending Approval)</span>
                </div>
            )}
        </div>
    );
}
