import React, { useState } from 'react';
import { FaUser, FaSave, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../../config';

const LeadDetailsModal = ({ lead, onClose, onUpdate }) => {
    const token = localStorage.getItem('admin_token');
    const [formData, setFormData] = useState({
        status: lead.status || 'new',
        contact_person: lead.contact_person || '',
        notes: lead.notes || ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.put(`${API_BASE_URL}/intelligence/leads/${lead.id}`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Lead Updated Successfully");
            onUpdate(res.data.lead); // Refresh list or update item
            onClose();
        } catch (error) {
            toast.error("Failed to update lead");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Manage Lead</h2>
                        <p className="text-xs text-gray-500 font-mono">{lead.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition-colors">
                        <FaTimes />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    {/* Status */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Status</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="interested">Interested</option>
                            <option value="converted">Converted (Invited)</option>
                            <option value="rejected">Rejected / Invalid</option>
                        </select>
                    </div>

                    {/* Contact Person */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Contact Person</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-400"><FaUser /></span>
                            <input
                                type="text"
                                name="contact_person"
                                value={formData.contact_person}
                                onChange={handleChange}
                                placeholder="e.g. Mr. Sharma (Manager)"
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Notes & Comments</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows="4"
                            placeholder="Record conversation details, callback times, or specific requirements..."
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                        ></textarea>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 active:scale-95 transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Saving...' : <><FaSave /> Save Updates</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LeadDetailsModal;
