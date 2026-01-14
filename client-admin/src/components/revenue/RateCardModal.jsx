import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave, FaExclamationTriangle } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

const RateCardModal = ({ property, onClose, onUpdate }) => {
    const { token } = useAuth();

    // Initial State Structure
    const [rates, setRates] = useState({
        base: {
            mon_thu: { vendor: 0, our: 0, customer: 0 },
            fri_sun: { vendor: 0, our: 0, customer: 0 },
            sat: { vendor: 0, our: 0, customer: 0 }
        },
        mattress: { vendor: 0, our: 0, customer: 0 },
        food: {
            veg: { vendor: 0, our: 0, customer: 0 },
            non_veg: { vendor: 0, our: 0, customer: 0 },
            jain: { vendor: 0, our: 0, customer: 0 }
        }
    });

    useEffect(() => {
        if (property) {
            // Load existing admin_pricing or fallback to legacy columns
            const ex = property.admin_pricing || {};

            // Legacy Fallbacks
            const legacyBase = {
                mon_thu: property.price_mon_thu || property.Price || 0,
                fri_sun: property.price_fri_sun || property.Price || 0,
                sat: property.price_sat || property.Price || 0
            };

            // Use PerCost and ResortWalaRate as fallbacks for Vendor/Our if not in admin_pricing
            // Note: PerCost is typically "Vendor Price" in the old system
            const baseVendor = property.PerCost || property.per_cost || 0;
            const baseOur = property.ResortWalaRate || property.resort_wala_rate || 0;

            setRates({
                base: ex.base || {
                    mon_thu: { vendor: baseVendor, our: baseOur, customer: legacyBase.mon_thu },
                    fri_sun: { vendor: baseVendor, our: baseOur, customer: legacyBase.fri_sun },
                    sat: { vendor: baseVendor, our: baseOur, customer: legacyBase.sat }
                },
                mattress: ex.mattress || { vendor: 0, our: 0, customer: 0 },
                food: ex.food || {
                    veg: { vendor: 0, our: 0, customer: 0 },
                    non_veg: { vendor: 0, our: 0, customer: 0 },
                    jain: { vendor: 0, our: 0, customer: 0 }
                }
            });
        }
    }, [property]);

    const handleChange = (section, category, type, value) => {
        setRates(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [category]: {
                    ...prev[section][category],
                    [type]: value
                }
            }
        }));
    };

    const handleSave = async () => {
        try {
            await axios.put(`/api/admin/revenue/properties/${property.PropertyId}/rates`, {
                admin_pricing: rates,
                // Sync legacy columns roughly so existing app still works
                price_mon_thu: rates.base.mon_thu.customer,
                price_fri_sun: rates.base.fri_sun.customer,
                price_sat: rates.base.sat.customer,
                // We don't have direct mapping for Veg/NonVeg to Breakfast/Lunch columns easily, 
                // so we rely on admin_pricing JSON for new features.
                // Legacy meal columns can be left as is or zeroed if needed.
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Rates updated successfully");
            onUpdate();
            onClose();
        } catch (error) {
            toast.error("Failed to update rates");
        }
    };

    const RateRow = ({ label, section, category, highlight = false }) => {
        const r = rates[section][category];
        const margin = r.customer - r.our; // Margin is Cust - Our Rate (Net)
        const marginPercent = r.customer ? Math.round((margin / r.customer) * 100) : 0;

        return (
            <tr className={`hover:bg-gray-50 transition ${highlight ? 'bg-blue-50/50' : ''}`}>
                <td className="px-4 py-3 font-medium text-gray-700">{label}</td>
                <td className="px-4 py-3">
                    <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-400 text-xs">₹</span>
                        <input
                            type="number"
                            className="w-full pl-6 pr-2 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm transition"
                            value={r.vendor}
                            onChange={e => handleChange(section, category, 'vendor', e.target.value)}
                        />
                    </div>
                </td>
                <td className="px-4 py-3">
                    <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-400 text-xs">₹</span>
                        <input
                            type="number"
                            className="w-full pl-6 pr-2 py-1.5 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-blue-700 bg-blue-50 transition"
                            value={r.our}
                            onChange={e => handleChange(section, category, 'our', e.target.value)}
                        />
                    </div>
                </td>
                <td className="px-4 py-3">
                    <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-400 text-xs">₹</span>
                        <input
                            type="number"
                            className="w-full pl-6 pr-2 py-1.5 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500 outline-none text-sm font-bold text-green-700 bg-green-50 transition"
                            value={r.customer}
                            onChange={e => handleChange(section, category, 'customer', e.target.value)}
                        />
                    </div>
                </td>
                <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${marginPercent >= 15 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {marginPercent}% (₹{margin})
                    </span>
                </td>
            </tr>
        );
    };

    if (!property) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <img src="/resortwala-logo.png" alt="ResortWala" className="h-10 bg-white rounded-lg p-1" />
                        <div>
                            <h2 className="text-2xl font-bold">Revenue Control</h2>
                            <p className="opacity-70 text-sm mt-1">{property.Name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition"><FaTimes size={20} /></button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto p-6 space-y-8 flex-1">

                    {/* Base Rates */}
                    <section>
                        <div className="flex items-center gap-2 mb-4 border-b pb-2">
                            <h3 className="text-lg font-bold text-gray-800">Base Rates (Room Only)</h3>
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">Tax Inclusive</span>
                        </div>
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                                <tr>
                                    <th className="px-4 py-2 w-1/4">Period</th>
                                    <th className="px-4 py-2 w-1/5">Vendor Ask</th>
                                    <th className="px-4 py-2 w-1/5 text-blue-700">Our Rate (Net)</th>
                                    <th className="px-4 py-2 w-1/5 text-green-700">Customer Rate</th>
                                    <th className="px-4 py-2 text-center">Margin</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                <RateRow label="Weekday (Mon-Thu)" section="base" category="mon_thu" />
                                <RateRow label="Weekend (Fri-Sun)" section="base" category="fri_sun" highlight />
                                <RateRow label="Saturday Special" section="base" category="sat" />
                            </tbody>
                        </table>
                    </section>

                    {/* Extra Occupancy */}
                    <section>
                        <div className="flex items-center gap-2 mb-4 border-b pb-2">
                            <h3 className="text-lg font-bold text-gray-800">Extra Occupancy (Mattress)</h3>
                        </div>
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                                <tr>
                                    <th className="px-4 py-2 w-1/4">Item</th>
                                    <th className="px-4 py-2 w-1/5">Vendor Ask</th>
                                    <th className="px-4 py-2 w-1/5 text-blue-700">Our Rate</th>
                                    <th className="px-4 py-2 w-1/5 text-green-700">Customer Rate</th>
                                    <th className="px-4 py-2 text-center">Margin</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                <RateRow label="Extra Mattress / Person" section="mattress" category="vendor" />
                                {/* Note: category here handles the single matress item, reusing components */}
                            </tbody>
                        </table>
                    </section>

                    {/* Meal Plans (Per Person) */}
                    <section>
                        <div className="flex items-center gap-2 mb-4 border-b pb-2">
                            <h3 className="text-lg font-bold text-gray-800">Meal Plans (Per Person)</h3>
                        </div>
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                                <tr>
                                    <th className="px-4 py-2 w-1/4">Meal Type</th>
                                    <th className="px-4 py-2 w-1/5">Vendor Ask</th>
                                    <th className="px-4 py-2 w-1/5 text-blue-700">Our Rate</th>
                                    <th className="px-4 py-2 w-1/5 text-green-700">Customer Rate</th>
                                    <th className="px-4 py-2 text-center">Margin</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                <RateRow label="Veg" section="food" category="veg" />
                                <RateRow label="Non-Veg" section="food" category="non_veg" />
                                <RateRow label="Jain" section="food" category="jain" />
                            </tbody>
                        </table>
                    </section>

                </div>

                {/* Footer */}
                <div className="bg-gray-50 p-6 border-t flex justify-between items-center shrink-0">
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                        <FaExclamationTriangle className="text-yellow-500" />
                        <span>Changes reflect immediately regarding calculations.</span>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition">Cancel</button>
                        <button onClick={handleSave} className="px-6 py-2.5 rounded-lg bg-black text-white font-bold hover:bg-gray-800 transition flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                            <FaSave /> Save Rates
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RateCardModal;
