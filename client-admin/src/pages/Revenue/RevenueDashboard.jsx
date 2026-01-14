import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { FaDownload, FaLayerGroup } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import RateCardModal from '../../components/revenue/RateCardModal';

const RevenueDashboard = () => {
    const { token } = useAuth();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modals
    const [activeRateProperty, setActiveRateProperty] = useState(null);

    useEffect(() => {
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        try {
            const res = await axios.get('/api/admin/revenue/properties', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProperties(res.data.data || res.data);
            setLoading(false);
        } catch (error) {
            toast.error("Failed to load revenue data");
            setLoading(false);
        }
    };

    const handleDownloadReport = () => {
        if (!properties.length) return toast.error("No data to download");

        const headers = [
            "Property Name",
            "M-Th Vendor", "M-Th Our", "M-Th Cust",
            "F-Su Vendor", "F-Su Our", "F-Su Cust",
            "Sat Vendor", "Sat Our", "Sat Cust",
            "Mattress Vendor", "Mattress Our", "Mattress Cust",
            "Veg Vendor", "Veg Our", "Veg Cust",
            "NonVeg Vendor", "NonVeg Our", "NonVeg Cust",
            "Jain Vendor", "Jain Our", "Jain Cust"
        ];

        const rows = properties.map(p => {
            const ap = p.admin_pricing || {};
            const base = ap.base || {};
            const matt = ap.mattress || { vendor: 0, our: 0, customer: 0 };
            const food = ap.food || {};
            const veg = food.veg || { vendor: 0, our: 0, customer: 0 };
            const nonVeg = food.non_veg || { vendor: 0, our: 0, customer: 0 };
            const jain = food.jain || { vendor: 0, our: 0, customer: 0 };

            // Fallbacks for base rates
            const pc = p.PerCost || p.per_cost || 0;
            const rwr = p.ResortWalaRate || p.resort_wala_rate || 0;

            const getVal = (val, fb) => val || fb || 0;

            // Base Mon-Thu
            const mt_v = getVal(base.mon_thu?.vendor, pc);
            const mt_o = getVal(base.mon_thu?.our, rwr);
            const mt_c = getVal(base.mon_thu?.customer, p.price_mon_thu || p.Price);

            // Base Fri-Sun
            const fs_v = getVal(base.fri_sun?.vendor, pc);
            const fs_o = getVal(base.fri_sun?.our, rwr);
            const fs_c = getVal(base.fri_sun?.customer, p.price_fri_sun || p.Price);

            // Base Sat
            const sat_v = getVal(base.sat?.vendor, pc);
            const sat_o = getVal(base.sat?.our, rwr);
            const sat_c = getVal(base.sat?.customer, p.price_sat || p.Price);

            return [
                `"${p.Name}"`,
                mt_v, mt_o, mt_c,
                fs_v, fs_o, fs_c,
                sat_v, sat_o, sat_c,
                matt.vendor, matt.our, matt.customer,
                veg.vendor, veg.our, veg.customer,
                nonVeg.vendor, nonVeg.our, nonVeg.customer,
                jain.vendor, jain.our, jain.customer
            ];
        });

        const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Full_Revenue_Report_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredProps = properties.filter(p => p.Name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {activeRateProperty && (
                <RateCardModal
                    property={activeRateProperty}
                    onClose={() => setActiveRateProperty(null)}
                    onUpdate={fetchProperties}
                />
            )}

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Revenue Control</h1>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleDownloadReport}
                        className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                        <FaDownload size={12} /> Report
                    </button>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search..."
                            className="pl-3 pr-8 py-1.5 border rounded-lg w-48 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 font-semibold text-[10px] uppercase tracking-wider border-b">
                        <tr>
                            <th className="px-3 py-3 w-[200px]">Property</th>
                            <th className="px-2 py-3 text-center">Mon-Thu</th>
                            <th className="px-2 py-3 text-center">Fri-Sun</th>
                            <th className="px-2 py-3 text-center">Sat</th>
                            <th className="px-3 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                        {loading && <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">Loading...</td></tr>}

                        {!loading && filteredProps.map(prop => {
                            const ap = prop.admin_pricing?.base;
                            const getVal = (path, fallback) => path || fallback || 0;
                            const pc = prop.PerCost || prop.per_cost || 0;
                            const rwr = prop.ResortWalaRate || prop.resort_wala_rate || 0;

                            // Compact Rate Box
                            const RateBox = ({ label, val, color }) => (
                                <div className={`px-1 py-0.5 rounded border text-center min-w-[40px] ${color}`}>
                                    <div className="font-bold leading-tight text-[10px]">₹{val}</div>
                                    <div className="text-[8px] opacity-70 leading-none">{label}</div>
                                </div>
                            );

                            const SplitGroup = ({ v, o, c }) => (
                                <div className="flex items-center justify-center gap-0.5">
                                    <RateBox label="V" val={v} color="bg-red-50 text-red-700 border-red-100" />
                                    <span className="text-gray-300 text-[8px] mx-0.5">→</span>
                                    <RateBox label="O" val={o} color="bg-blue-50 text-blue-700 border-blue-100" />
                                    <span className="text-gray-300 text-[8px] mx-0.5">→</span>
                                    <RateBox label="C" val={c} color="bg-green-50 text-green-700 border-green-100" />
                                </div>
                            );

                            // Values
                            const wd_v = getVal(ap?.mon_thu?.vendor, pc);
                            const wd_o = getVal(ap?.mon_thu?.our, rwr);
                            const wd_c = getVal(ap?.mon_thu?.customer, prop.price_mon_thu || prop.Price);

                            const we_v = getVal(ap?.fri_sun?.vendor, pc);
                            const we_o = getVal(ap?.fri_sun?.our, rwr);
                            const we_c = getVal(ap?.fri_sun?.customer, prop.price_fri_sun || prop.Price);

                            const sat_v = getVal(ap?.sat?.vendor, pc);
                            const sat_o = getVal(ap?.sat?.our, rwr);
                            const sat_c = getVal(ap?.sat?.customer, prop.price_sat || prop.Price);

                            return (
                                <tr key={prop.PropertyId} className="hover:bg-blue-50/30 transition">
                                    <td className="px-3 py-2">
                                        <a href={`https://resortwala.com/stay/${prop.PropertyId}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group max-w-[200px]">
                                            <div className="w-8 h-8 rounded-md bg-gray-200 bg-cover bg-center shrink-0 group-hover:opacity-80 transition"
                                                style={{ backgroundImage: `url(${prop.image_url})` }}></div>
                                            <div className="overflow-hidden">
                                                <p className="font-bold text-gray-900 truncate group-hover:text-blue-600 transition text-xs">{prop.Name}</p>
                                                <div className="flex items-center gap-1 text-[10px] text-gray-400 truncate">
                                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${prop.IsActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                    {prop.Location}
                                                </div>
                                            </div>
                                        </a>
                                    </td>

                                    {/* Splits */}
                                    <td className="px-2 py-2"><SplitGroup v={wd_v} o={wd_o} c={wd_c} /></td>
                                    <td className="px-2 py-2"><SplitGroup v={we_v} o={we_o} c={we_c} /></td>
                                    <td className="px-2 py-2"><SplitGroup v={sat_v} o={sat_o} c={sat_c} /></td>

                                    <td className="px-3 py-2 text-right">
                                        <button
                                            onClick={() => setActiveRateProperty(prop)}
                                            className="inline-flex items-center justify-center w-8 h-8 bg-black hover:bg-gray-800 text-white rounded-md shadow-sm transition transform hover:scale-105"
                                            title="Manage Rates"
                                        >
                                            <FaLayerGroup size={12} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {!loading && filteredProps.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                                    No properties found matching "{searchTerm}"
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RevenueDashboard;
