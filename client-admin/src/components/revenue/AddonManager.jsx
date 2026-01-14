import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { FaTrash, FaPlus, FaTimes } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const AddonManager = ({ propertyId, propertyName, onClose, onUpdate }) => {
    const { token } = useAuth();
    const [addons, setAddons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newAddon, setNewAddon] = useState({ name: '', cost_price: '', selling_price: '' });

    useEffect(() => {
        if (propertyId) fetchAddons();
    }, [propertyId]);

    const fetchAddons = async () => {
        try {
            const res = await axios.get(`/api/admin/revenue/properties/${propertyId}/addons`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAddons(res.data);
        } catch (error) {
            toast.error("Failed to load add-ons");
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newAddon.name || !newAddon.selling_price) return toast.error("Name and Price required");

        try {
            await axios.post(`/api/admin/revenue/properties/${propertyId}/addons`, newAddon, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Add-on created");
            setNewAddon({ name: '', cost_price: '', selling_price: '' });
            fetchAddons();
            onUpdate(); // refresh count in parent
        } catch (error) {
            toast.error("Failed to add add-on");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this add-on?")) return;
        try {
            await axios.delete(`/api/admin/revenue/properties/${propertyId}/addons/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Add-on deleted");
            fetchAddons();
            onUpdate();
        } catch (error) {
            toast.error("Failed to delete");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}>
            <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Manage Add-ons</h2>
                        <p className="text-sm text-gray-500">{propertyName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><FaTimes /></button>
                </div>

                {/* Add New Form */}
                <div className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Create New</h3>
                    <div className="space-y-3">
                        <input
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                            placeholder="Add-on Name (e.g. BBQ Kit)"
                            value={newAddon.name}
                            onChange={e => setNewAddon({ ...newAddon, name: e.target.value })}
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Vendor Cost</label>
                                <input
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                                    placeholder="0"
                                    type="number"
                                    value={newAddon.cost_price}
                                    onChange={e => setNewAddon({ ...newAddon, cost_price: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Customer Price</label>
                                <input
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                                    placeholder="0"
                                    type="number"
                                    value={newAddon.selling_price}
                                    onChange={e => setNewAddon({ ...newAddon, selling_price: e.target.value })}
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleAdd}
                            className="w-full py-2 bg-black text-white rounded-lg text-sm font-bold hover:bg-gray-800"
                        >
                            <FaPlus className="inline mr-2" /> Add Item
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto">
                    <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Active Items</h3>
                    {loading ? <p>Loading...</p> : (
                        <div className="space-y-2">
                            {addons.map(addon => {
                                const margin = addon.selling_price - addon.cost_price;
                                const marginPercent = Math.round((margin / addon.selling_price) * 100);

                                return (
                                    <div key={addon.id} className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-blue-200 transition">
                                        <div>
                                            <p className="font-bold text-gray-800">{addon.name}</p>
                                            <p className="text-xs text-gray-500">
                                                Buy: ₹{addon.cost_price} | Sell: <span className="text-green-600 font-bold">₹{addon.selling_price}</span>
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-bold text-green-600 mb-1">
                                                +{marginPercent}%
                                            </div>
                                            <button onClick={() => handleDelete(addon.id)} className="text-red-400 hover:text-red-600 p-1">
                                                <FaTrash size={12} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                            {addons.length === 0 && <p className="text-center text-gray-400 text-sm py-4">No add-ons yet.</p>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddonManager;
