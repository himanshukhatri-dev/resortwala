import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { FiSave, FiActivity, FiArrowRight } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const SYSTEM_EVENTS = [
    { id: 'auth.otp', label: 'Auth: Send OTP (Email/SMS)' },
    { id: 'auth.welcome', label: 'Auth: Welcome New User' },
    { id: 'auth.password_reset', label: 'Auth: Password Reset Request' },

    { id: 'booking.initiated', label: 'Booking: Initiated (Payment Pending)' },
    { id: 'booking.confirmed_customer', label: 'Booking: Confirmed (Customer)' },
    { id: 'booking.new_request_vendor', label: 'Booking: Confirmed (Vendor Alert)' },
    { id: 'booking.new_request_admin', label: 'Booking: Confirmed (Admin Alert)' },
    { id: 'booking.status_update_customer', label: 'Booking: Status Changed' },
    { id: 'booking.cancelled', label: 'Booking: Cancelled' },
    { id: 'booking.completed', label: 'Booking: Completed (Request Feedback)' },

    { id: 'payment.success', label: 'Payment: Successful' },
    { id: 'payment.failed', label: 'Payment: Failed' },
    { id: 'payment.refund_initiated', label: 'Payment: Refund Initiated' },

    { id: 'vendor.registered', label: 'Vendor: Registered (Pending Approval)' },
    { id: 'vendor.approved', label: 'Vendor: Account Approved' },
    { id: 'vendor.rejected', label: 'Vendor: Account Rejected' },
    { id: 'vendor.payout_processed', label: 'Vendor: Payout Processed' },

    { id: 'property.created_admin', label: 'Property: New Listing Created (Admin)' },
    { id: 'property.approved', label: 'Property: Listing Approved' },
    { id: 'property.rejected', label: 'Property: Listing Rejected' },
    { id: 'property.live', label: 'Property: Is Live' }
];

export default function TriggerManager() {
    const { token } = useAuth();
    const [triggers, setTriggers] = useState({}); // { 'event_name': { ...triggerData } }
    const [templates, setTemplates] = useState({ email: [], sms: [], whatsapp: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [trigRes, tplRes, smsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/admin/notifications/setup/triggers`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_BASE_URL}/admin/notifications/setup/templates?channel=email`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_BASE_URL}/admin/notifications/setup/templates?channel=sms`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            // Transform trigger array to map for easier UI binding
            const trigMap = {};
            trigRes.data.forEach(t => { trigMap[t.event_name] = t; });
            setTriggers(trigMap);

            setTemplates({
                email: tplRes.data,
                sms: smsRes.data,
                whatsapp: []
            });

        } catch (error) {
            toast.error("Failed to load configuration");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (eventName) => {
        const trigger = triggers[eventName];
        if (!trigger) return;

        try {
            await axios.post(`${API_BASE_URL}/admin/notifications/setup/triggers`, {
                event_name: eventName,
                email_template_id: trigger.email_template_id,
                sms_template_id: trigger.sms_template_id,
                whatsapp_template_id: trigger.whatsapp_template_id,
                audience: trigger.audience || 'customer'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Trigger Saved!");
        } catch (error) {
            toast.error("Failed to save trigger");
        }
    };

    const updateTrigger = (eventName, field, value) => {
        setTriggers(prev => ({
            ...prev,
            [eventName]: { ...prev[eventName], [field]: value }
        }));
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                        <th className="p-4 text-xs font-black text-slate-400 uppercase w-1/4">System Event</th>
                        <th className="p-4 text-xs font-black text-slate-400 uppercase w-1/4">Email Template</th>
                        <th className="p-4 text-xs font-black text-slate-400 uppercase w-1/4">SMS Template</th>
                        <th className="p-4 text-xs font-black text-slate-400 uppercase w-1/6">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {SYSTEM_EVENTS.map(evt => {
                        const current = triggers[evt.id] || { event_name: evt.id };
                        return (
                            <tr key={evt.id} className="hover:bg-slate-50">
                                <td className="p-4">
                                    <div className="font-bold text-slate-800 text-sm">{evt.label}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">{evt.id}</div>
                                </td>
                                <td className="p-4">
                                    <select
                                        className="saas-input w-full text-xs"
                                        value={current.email_template_id || ''}
                                        onChange={e => updateTrigger(evt.id, 'email_template_id', e.target.value)}
                                    >
                                        <option value="">-- None --</option>
                                        {templates.email.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </td>
                                <td className="p-4">
                                    <select
                                        className="saas-input w-full text-xs"
                                        value={current.sms_template_id || ''}
                                        onChange={e => updateTrigger(evt.id, 'sms_template_id', e.target.value)}
                                    >
                                        <option value="">-- None --</option>
                                        {templates.sms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </td>
                                <td className="p-4">
                                    <button
                                        onClick={() => handleSave(evt.id)}
                                        className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-colors"
                                    >
                                        <FiSave />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
