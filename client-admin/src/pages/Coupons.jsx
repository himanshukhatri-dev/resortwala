import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import {
    FiPlus, FiTrash2, FiTag, FiCalendar, FiToggleLeft, FiToggleRight,
    FiPercent, FiDollarSign
} from 'react-icons/fi';
import Loader from '../components/Loader';
import { toast } from 'react-hot-toast';

export default function Coupons() {
    const { token } = useAuth();
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        code: '',
        discount_type: 'fixed',
        value: '',
        expiry_date: '',
        is_active: true
    });

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/coupons`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCoupons(res.data || []);
        } catch (error) {
            toast.error("Failed to fetch coupons");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE_URL}/admin/coupons`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Coupon Created Successfully");
            setShowModal(false);
            setFormData({ code: '', discount_type: 'fixed', value: '', expiry_date: '', is_active: true });
            fetchCoupons();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create coupon");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure? This action cannot be undone.")) return;
        try {
            await axios.delete(`${API_BASE_URL}/admin/coupons/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Coupon Deleted");
            fetchCoupons();
        } catch (error) {
            toast.error("Delete failed");
        }
    };

    const toggleStatus = async (coupon) => {
        try {
            await axios.put(`${API_BASE_URL}/admin/coupons/${coupon.id}`, {
                is_active: !coupon.is_active
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchCoupons();
            toast.success(`Coupon ${!coupon.is_active ? 'Activated' : 'Deactivated'}`);
        } catch (error) {
            toast.error("Update failed");
        }
    };

    if (loading) return <Loader message="Loading Coupons..." />;

    return (
        <div className="space-y-6 pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Coupon <span className="text-indigo-600">Manager</span></h1>
                    <p className="text-slate-500 text-xs font-bold mt-1 uppercase tracking-wider">Create & Manage Discount Codes</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="saas-button-primary flex items-center gap-2"
                >
                    <FiPlus /> New Coupon
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coupons.map(coupon => (
                    <div key={coupon.id} className={`saas-card p-5 relative group transition-all ${!coupon.is_active ? 'opacity-60 grayscale' : ''}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-sm font-black tracking-widest uppercase flex items-center gap-2 border border-indigo-100 border-dashed">
                                <FiTag size={14} />
                                {coupon.code}
                            </div>
                            <button
                                onClick={() => toggleStatus(coupon)}
                                className={`transition-colors ${coupon.is_active ? 'text-emerald-500 hover:text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {coupon.is_active ? <FiToggleRight size={24} /> : <FiToggleLeft size={24} />}
                            </button>
                        </div>

                        <div className="mb-4">
                            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-1">
                                {coupon.discount_type === 'fixed' ? '₹' : ''}
                                {coupon.value}
                                {coupon.discount_type === 'percentage' ? '%' : ''}
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-2 bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
                                    OFF
                                </span>
                            </h3>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                <FiCalendar className="text-slate-300" />
                                {coupon.expiry_date ? `Expires: ${new Date(coupon.expiry_date).toLocaleDateString()}` : 'No Expiry'}
                            </div>
                            <button
                                onClick={() => handleDelete(coupon.id)}
                                className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <FiTrash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}

                {/* Empty State Card just to fill grid if needed, or if empty list */}
                {coupons.length === 0 && (
                    <div className="col-span-full p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                            <FiTag size={20} />
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase">No active coupons found</p>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-lg font-black text-slate-900 uppercase">Create Coupon</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Coupon Code</label>
                                <input
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    placeholder="e.g. WELCOME50"
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-black tracking-widest focus:ring-2 focus:ring-indigo-500 uppercase placeholder:normal-case placeholder:tracking-normal placeholder:font-medium"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Type</label>
                                    <div className="flex bg-slate-50 p-1 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, discount_type: 'fixed' })}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${formData.discount_type === 'fixed' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
                                        >
                                            <FiDollarSign className="mx-auto" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, discount_type: 'percentage' })}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${formData.discount_type === 'percentage' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
                                        >
                                            <FiPercent className="mx-auto" />
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Value</label>
                                    <input
                                        type="number"
                                        value={formData.value}
                                        onChange={e => setFormData({ ...formData, value: e.target.value })}
                                        required
                                        className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Expiry Date (Optional)</label>
                                <input
                                    type="date"
                                    value={formData.expiry_date}
                                    onChange={e => setFormData({ ...formData, expiry_date: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <button type="submit" className="w-full saas-button-primary mt-4 py-3">
                                Create Active Coupon
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
