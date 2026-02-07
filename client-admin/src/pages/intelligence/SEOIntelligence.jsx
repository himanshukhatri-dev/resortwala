import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaSearch, FaPlus, FaEdit, FaTrash, FaExternalLinkAlt, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import toast from 'react-hot-toast';

const SEOIntelligence = () => {
    const [configs, setConfigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, active: 0, issues: 0 });

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('admin_token');
            console.log("SEO Intelligence: Auth check:", {
                hasToken: !!token,
                tokenSnippet: token ? `${token.substring(0, 5)}...` : 'null'
            });

            const response = await axios.get(`${API_BASE_URL}/admin/intelligence/data/s_e_o_configs`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data && response.data.data) {
                console.log("SEO Intelligence: Fetch Success", response.data.data.length);
                setConfigs(response.data.data);

                // Calculate stats based on active/inactive or missing metadata
                const active = response.data.data.filter(c => c.is_active).length;
                const issues = response.data.data.filter(c => !c.meta_title || !c.meta_description).length;
                setStats({
                    total: response.data.data.length,
                    active,
                    issues
                });
            }
        } catch (error) {
            console.error("SEO Intelligence: Fetch Error", error.response?.status, error.message);
            toast.error("Failed to load SEO configurations");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 font-serif">SEO Intelligence</h1>
                    <p className="text-gray-500">Manage transactional landing pages and keyword intent</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-[#EAB308] text-white rounded-lg font-bold hover:bg-yellow-600 transition shadow-md">
                    <FaPlus /> New Landing Page
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Optimized Pages</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-sm font-medium text-gray-500 mb-1">Active Indexable</p>
                    <p className="text-3xl font-bold text-green-600">{stats.active}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-sm font-medium text-gray-500 mb-1">Metadata Issues</p>
                    <p className="text-3xl font-bold text-orange-500">{stats.issues}</p>
                </div>
            </div>

            {/* Search and Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-50 flex gap-4">
                    <div className="relative flex-1">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by slug or keyword..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#EAB308] transition"
                        />
                    </div>
                </div>

                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Page Intent / Slug</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">H1 Title</th>
                            <th className="px-6 py-4">Target City</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-400">Loading configurations...</td></tr>
                        ) : configs.map(config => (
                            <tr key={config.id} className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900">{config.slug}</div>
                                    <div className="text-xs text-gray-500 capitalize">{config.page_type.replace('_', ' ')}</div>
                                </td>
                                <td className="px-6 py-4">
                                    {config.is_active ? (
                                        <span className="flex items-center gap-1 text-green-600 text-xs font-bold">
                                            <FaCheckCircle /> Active
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-gray-400 text-xs font-bold">
                                            <FaTrash /> Paused
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                                    {config.h1_title || <span className="text-orange-400">Missing H1</span>}
                                </td>
                                <td className="px-6 py-4 text-sm font-medium capitalize">
                                    {config.target_city}
                                </td>
                                <td className="px-6 py-4 text-right text-gray-400 flex justify-end gap-3 pt-6">
                                    <button onClick={() => window.open(`http://localhost:5173/${config.slug}`, '_blank')} className="hover:text-blue-600 transition"><FaExternalLinkAlt /></button>
                                    <button className="hover:text-[#EAB308] transition"><FaEdit /></button>
                                    <button className="hover:text-red-500 transition"><FaTrash /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SEOIntelligence;
