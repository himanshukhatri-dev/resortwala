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
                admin_pricing: pricing
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Property Approved and Pricing Saved!');
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
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-6 border-b flex justify-between items-center">
                    <h1 className="text-2xl font-bold">{property.Name} - Approval & Pricing</h1>
                    <button
                        onClick={handleApprove}
                        disabled={saving}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                        {saving ? 'Approving...' : 'Approve & Save'}
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Responsive Pricing Section Component */}
                    {['mon_thu', 'fri_sun', 'sat'].map((day) => {
                        const titles = { mon_thu: 'Monday to Thursday Pricing', fri_sun: 'Friday & Sunday Pricing', sat: 'Saturday Pricing' };
                        const colors = { mon_thu: 'blue', fri_sun: 'purple', sat: 'orange' };
                        const color = colors[day];

                        return (
                            <div key={day} className="border rounded-xl overflow-hidden">
                                <div className={`bg-${color}-50 p-4 font-bold text-${color}-800`}>{titles[day]}</div>

                                {/* DESKTOP TABLE */}
                                <div className="hidden md:block">
                                    <table className="w-full text-left">
                                        <thead className="text-sm text-gray-500 bg-gray-50">
                                            <tr>
                                                <th className="p-3">Type</th>
                                                <th className="p-3">Current (Vendor)</th>
                                                <th className="p-3">Discounted (ResortWala)</th>
                                                <th className="p-3">Final (Client)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {renderPriceRow('Villa Price', day, 'villa')}
                                            {renderPriceRow('Extra Person', day, 'extra_person')}
                                            {renderPriceRow('Meal per Person', day, 'meal_person')}
                                        </tbody>
                                    </table>
                                </div>

                                {/* MOBILE BLOCKS */}
                                <div className="md:hidden p-4 space-y-4">
                                    {['villa', 'extra_person', 'meal_person'].map((type) => (
                                        <div key={type} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                            <div className="font-bold text-gray-900 mb-2 border-b pb-2">
                                                {type === 'villa' ? 'Villa Price' : type === 'extra_person' ? 'Extra Person' : 'Meal per Person'}
                                            </div>
                                            <div className="grid grid-cols-2 gap-y-3 text-sm">
                                                <div className="text-gray-500">Vendor Price:</div>
                                                <div className="font-medium">₹{pricing[day][type].current}</div>

                                                <div className="text-gray-500 self-center">Discounted:</div>
                                                <div>
                                                    <input
                                                        type="number"
                                                        className="border p-2 rounded w-full bg-white"
                                                        value={pricing[day][type].discounted}
                                                        onChange={(e) => handlePriceChange(day, type, 'discounted', e.target.value)}
                                                        placeholder="0"
                                                    />
                                                </div>

                                                <div className="text-gray-500 self-center">Final Client:</div>
                                                <div>
                                                    <input
                                                        type="number"
                                                        className="border p-2 rounded w-full bg-white font-bold text-green-700"
                                                        value={pricing[day][type].final}
                                                        onChange={(e) => handlePriceChange(day, type, 'final', e.target.value)}
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
