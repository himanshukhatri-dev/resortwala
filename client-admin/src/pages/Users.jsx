import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { useModal } from '../context/ModalContext';
import { API_BASE_URL } from '../config';
import { FaUserPlus, FaTrash, FaSearch, FaEnvelope, FaPhone, FaExchangeAlt, FaCheckCircle, FaUserCircle, FaWhatsapp } from 'react-icons/fa';

export default function Users() {
    const { token } = useAuth();
    const { showConfirm, showSuccess, showError } = useModal();
    const [activeTab, setActiveTab] = useState('admins'); // 'admins' | 'vendors' | 'customers'
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [onboardingLoading, setOnboardingLoading] = useState(false);

    // Modal state for Adding/Onboarding
    const [showAddModal, setShowAddModal] = useState(false);
    const [onboardingData, setOnboardingData] = useState({
        name: '',
        mobile: '',
        email: '',
        role: 'customer'
    });

    // Modal state for Role Management
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newRole, setNewRole] = useState('');

    useEffect(() => {
        fetchUsers();
    }, [activeTab]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            let endpoint = '';
            if (activeTab === 'admins') endpoint = '/admin/users/admins';
            else if (activeTab === 'vendors') endpoint = '/admin/users/vendors';
            else endpoint = '/admin/users/customers';

            const res = await axios.get(`${API_BASE_URL}${endpoint}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data);
        } catch (error) {
            console.error(error);
            showError('Error', 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const handleOnboard = async (e) => {
        e.preventDefault();
        setOnboardingLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/admin/onboard`, onboardingData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowAddModal(false);
            fetchUsers();

            // Dynamic URL Construction for Fallback/WhatsApp
            let tokenPart = '';
            if (res.data.onboarding_url && res.data.onboarding_url.includes('token=')) {
                tokenPart = res.data.onboarding_url.split('token=')[1];
            } else if (res.data.onboarding_url) {
                const urlObj = new URL(res.data.onboarding_url);
                tokenPart = urlObj.searchParams.get('token');
            }

            // Construct Base URL based on Role and Current Origin
            const currentOrigin = window.location.origin; // e.g., http://72.61.242.42 or http://stagingadmin.resortwala.com
            let targetBaseUrl = currentOrigin;

            // Logic to switch domains/subdomains
            if (!currentOrigin.match(/\d+\.\d+\.\d+\.\d+/)) {
                // DOMAIN MODE (e.g. stagingadmin.resortwala.com)
                const hostParts = window.location.hostname.split('.');
                // Assuming format: [subdomain, domain, tld]
                // If subdomain is 'stagingadmin' or 'admin', we replace it.

                let rootDomain = hostParts.slice(1).join('.'); // resortwala.com
                if (hostParts.length < 3) rootDomain = window.location.hostname; // Fallback

                // Prefix mapping
                const prefixes = {
                    admin: 'stagingadmin',   // or 'admin'
                    vendor: 'stagingvendor', // or 'vendor'
                    customer: 'staging'      // or 'www'
                };

                // Adjust prefixes if we are on 'staging' vs 'production'
                // Detection: if hostname contains 'staging', use staging prefixes
                const isStaging = window.location.hostname.includes('staging');

                if (onboardingData.role === 'customer') {
                    // Customer Link
                    targetBaseUrl = `${window.location.protocol}//${isStaging ? 'staging' : 'www'}.${rootDomain}`;
                } else if (onboardingData.role === 'vendor') {
                    // Vendor Link
                    targetBaseUrl = `${window.location.protocol}//${isStaging ? 'stagingvendor' : 'vendor'}.${rootDomain}`;
                } else {
                    // Admin Link (Keep current mostly, or explicit)
                    targetBaseUrl = `${window.location.protocol}//${isStaging ? 'stagingadmin' : 'admin'}.${rootDomain}`;
                }
            } else {
                // IP MODE (http://72.61.242.42) - Use Ports or Paths?
                // Providing Paths as fallback based on typical setup
                // Customer: /
                // Vendor: /vendor
                // Admin: /admin
                targetBaseUrl = currentOrigin;
            }

            let path = '';
            if (onboardingData.role === 'customer') {
                path = '/set-password';
            } else if (onboardingData.role === 'vendor') {
                path = '/vendor/set-password'; // Vendors typically have /vendor prefix in router if single SPA or just /set-password if separate subdomain
                if (!targetBaseUrl.includes('/vendor') && !targetBaseUrl.includes('vendor.')) {
                    // If we are on IP mode, we might need /vendor prefix in path if it's served from same origin
                    path = '/vendor/set-password';
                } else {
                    path = '/set-password'; // If subdomain handles routing, likely just /set-password
                }
            } else {
                path = '/admin/set-password';
            }

            // Clean up double slashes just in case
            const dynamicUrl = `${targetBaseUrl}${path}`.replace(/([^:]\/)\/+/g, "$1") + `?token=${tokenPart}`;

            const whatsappMessage = encodeURIComponent(`Hello ${onboardingData.name}, welcome to ResortWala! Complete your registration here: ${dynamicUrl}`);
            const whatsappUrl = `https://wa.me/${onboardingData.mobile.replace(/\D/g, '')}?text=${whatsappMessage}`;

            const message = (
                <div>
                    <p>Invitation sent successfully.</p>
                    {res.data.onboarding_url && (
                        <div className="mt-4 space-y-3">
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 break-all text-xs font-mono">
                                <p className="font-bold text-gray-500 mb-1">Backup Link:</p>
                                {dynamicUrl}
                            </div>

                            <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 w-full py-3 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl font-bold transition-all shadow-lg active:scale-95"
                            >
                                <FaWhatsapp size={20} /> Share via WhatsApp
                            </a>
                        </div>
                    )}
                </div>
            );

            showSuccess('Onboarded', message);
            setOnboardingData({ name: '', mobile: '', email: '', role: 'customer' });
        } catch (error) {
            showError('Error', error.response?.data?.message || 'Failed to onboard user');
        } finally {
            setOnboardingLoading(false);
        }
    };

    const handleUpdateRole = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`${API_BASE_URL}/admin/users/${selectedUser.id}/role`, { role: newRole }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowRoleModal(false);
            fetchUsers();
            showSuccess('Updated', 'User role updated successfully');
        } catch (error) {
            showError('Error', error.response?.data?.message || 'Failed to update role');
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await showConfirm(
            'Delete User',
            'Are you sure? This will permanently remove the user and their associated data.',
            'Delete User',
            'Cancel',
            'danger'
        );
        if (!confirmed) return;

        setLoading(true);
        try {
            const endpoint = activeTab === 'customers' ? `/admin/users/customers/${id}` : `/admin/users/${id}`;
            await axios.delete(`${API_BASE_URL}${endpoint}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchUsers(); // fetchUsers handles its own loading state but we kept it true
            showSuccess('Deleted', 'Account removed successfully');
        } catch (error) {
            setLoading(false);
            showError('Deletion Failed', error.response?.data?.message || 'Failed to delete user');
        }
    };

    const handleLoginAs = async (userId) => {
        try {
            const typeParam = activeTab === 'customers' ? 'customer' : 'user';
            const res = await axios.post(`${API_BASE_URL}/admin/impersonate/${userId}?type=${typeParam}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const { token: newToken, redirect_url } = res.data;
            const separator = redirect_url.includes('?') ? '&' : '?';
            window.open(`${redirect_url}${separator}impersonate_token=${newToken}`, '_blank');
        } catch (error) {
            showError('Error', 'Impersonation failed');
        }
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.phone?.includes(searchTerm) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleBadge = (role) => {
        const styles = {
            admin: 'bg-indigo-100 text-indigo-700 border-indigo-200',
            vendor: 'bg-orange-100 text-orange-700 border-orange-200',
            customer: 'bg-emerald-100 text-emerald-700 border-emerald-200'
        };
        return <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${styles[role] || 'bg-gray-100'}`}>{role || activeTab.slice(0, -1)}</span>;
    };

    return (
        <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                            User Authority
                        </h1>
                        <p className="text-gray-500 font-medium font-outfit">Control roles, onboard users and manage account access</p>
                    </div>
                    <button
                        onClick={() => {
                            setOnboardingData({ ...onboardingData, role: activeTab === 'admins' ? 'admin' : (activeTab === 'vendors' ? 'vendor' : 'customer') });
                            setShowAddModal(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-blue-100 flex items-center gap-2 transition-all active:scale-95"
                    >
                        <FaUserPlus /> Onboard New User
                    </button>
                </div>

                {/* Search & Tabs */}
                <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex bg-gray-100 p-1 rounded-2xl w-full md:w-auto overflow-x-auto">
                        {['admins', 'vendors', 'customers'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <div className="relative flex-1 group w-full">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, phone or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-50 outline-none font-bold text-gray-700 transition-all placeholder-gray-300"
                        />
                    </div>
                </div>

                {/* Content Table / Cards */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="p-20 text-center"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100">
                                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">User Profile</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact Identity</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Authorization</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Operations</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredUsers.map(user => (
                                            <tr key={user.id} className="hover:bg-blue-50/20 transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 text-xl font-black border border-gray-100">
                                                            {user.name?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-gray-900 leading-none mb-1">{user.name}</div>
                                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">ID #{user.id} • {new Date(user.created_at).toLocaleDateString()}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="space-y-1">
                                                        <div className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                                            <FaEnvelope className="text-gray-300 w-3" /> {user.email}
                                                        </div>
                                                        <div className="text-xs font-medium text-gray-500 flex items-center gap-2">
                                                            <FaPhone className="text-gray-300 w-3" /> {user.phone || 'NO MOBILE'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    {getRoleBadge(user.role)}
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleLoginAs(user.id)}
                                                            className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black hover:bg-emerald-100 transition-all uppercase tracking-widest"
                                                        >
                                                            Login As
                                                        </button>
                                                        {activeTab !== 'customers' && (
                                                            <button
                                                                onClick={() => { setSelectedUser(user); setNewRole(user.role); setShowRoleModal(true); }}
                                                                className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-all border border-indigo-100"
                                                                title="Change Role"
                                                            >
                                                                <FaExchangeAlt size={14} />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDelete(user.id)}
                                                            className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all border border-red-100"
                                                        >
                                                            <FaTrash size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden divide-y divide-gray-50 bg-gray-50">
                                {filteredUsers.map(user => (
                                    <div key={user.id} className="p-6 bg-white space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg shadow-blue-100">
                                                    {user.name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-black text-gray-900">{user.name}</div>
                                                    <div className="mt-1">{getRoleBadge(user.role)}</div>
                                                </div>
                                            </div>
                                            <button onClick={() => handleDelete(user.id)} className="p-3 text-red-300 hover:text-red-600 transition-colors">
                                                <FaTrash />
                                            </button>
                                        </div>

                                        <div className="space-y-2 py-3 border-y border-gray-50">
                                            <div className="flex items-center gap-3 text-sm font-bold text-gray-600">
                                                <FaEnvelope className="text-gray-300 w-4" /> {user.email}
                                            </div>
                                            <div className="flex items-center gap-3 text-sm font-bold text-gray-600">
                                                <FaPhone className="text-gray-300 w-4" /> {user.phone || 'No Mobile Provided'}
                                            </div>
                                        </div>

                                        <div className="flex gap-2 pt-2">
                                            <button onClick={() => handleLoginAs(user.id)} className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black shadow-lg shadow-emerald-50 active:scale-95 transition-all uppercase tracking-widest leading-none">Impersonate</button>
                                            {activeTab !== 'customers' && (
                                                <button
                                                    onClick={() => { setSelectedUser(user); setNewRole(user.role); setShowRoleModal(true); }}
                                                    className="w-14 h-12 flex items-center justify-center bg-indigo-50 text-indigo-700 rounded-2xl active:scale-95 transition-all border border-indigo-100"
                                                >
                                                    <FaExchangeAlt />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                    {filteredUsers.length === 0 && !loading && (
                        <div className="p-20 text-center text-gray-300 font-black uppercase tracking-[0.2em] text-xs">No matching authority records found</div>
                    )}
                </div>

                {/* Modal: Onboard User */}
                {
                    showAddModal && (
                        <Modal title="Onboard New Authority" onClose={() => setShowAddModal(false)} showFooter={false}>
                            <form onSubmit={handleOnboard} className="space-y-5 p-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                                        <input
                                            className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold placeholder-gray-300 transition-all text-gray-700"
                                            placeholder="e.g. Rahul Sharma"
                                            required
                                            value={onboardingData.name}
                                            onChange={e => setOnboardingData({ ...onboardingData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mobile Number</label>
                                        <input
                                            className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold placeholder-gray-300 transition-all text-gray-700"
                                            placeholder="+91..."
                                            required
                                            value={onboardingData.mobile}
                                            onChange={e => setOnboardingData({ ...onboardingData, mobile: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1 text-left">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email (Optional)</label>
                                    <input
                                        className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold placeholder-gray-300 transition-all text-gray-700"
                                        placeholder="email@resortwala.com"
                                        type="email"
                                        value={onboardingData.email}
                                        onChange={e => setOnboardingData({ ...onboardingData, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1 text-left">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Access Role & Permission</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['customer', 'vendor', 'admin'].map(r => (
                                            <button
                                                key={r}
                                                type="button"
                                                onClick={() => setOnboardingData({ ...onboardingData, role: r })}
                                                className={`py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${onboardingData.role === r ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-100' : 'bg-white text-gray-400 border-gray-100 hover:border-blue-100'}`}
                                            >
                                                {r}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 mt-4 text-left">
                                    <p className="text-[10px] text-amber-600 font-black leading-relaxed flex items-start gap-2 uppercase tracking-tight">
                                        <span className="bg-amber-600 text-white w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[8px]">!</span>
                                        <div>Invitation link will be generated for secure password setup and sent via SMS/Email.</div>
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={onboardingLoading}
                                    className={`w-full py-4.5 bg-blue-600 text-white rounded-[1.5rem] font-black shadow-2xl shadow-blue-100 mt-2 hover:bg-blue-700 active:scale-95 transition-all text-xs tracking-widest uppercase ${onboardingLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {onboardingLoading ? 'Initializing...' : 'Initialize Onboarding'}
                                </button>
                            </form>
                        </Modal>
                    )
                }

                {/* Modal: Change Role */}
                {
                    showRoleModal && selectedUser && (
                        <Modal title="Manage Authorization" onClose={() => setShowRoleModal(false)} showFooter={false}>
                            <form onSubmit={handleUpdateRole} className="space-y-6 p-2 text-left">
                                <div className="flex items-center gap-4 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600 font-extrabold border border-blue-50">{selectedUser.name?.charAt(0)}</div>
                                    <div>
                                        <div className="font-black text-gray-900 leading-none mb-1">{selectedUser.name}</div>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Current Level: {selectedUser.role}</div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select New Security Level</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {['customer', 'vendor', 'admin'].map(r => (
                                            <button
                                                key={r}
                                                type="button"
                                                onClick={() => setNewRole(r)}
                                                className={`flex items-center justify-between px-6 py-5 rounded-2xl transition-all border-2 ${newRole === r ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-100 scale-[1.01]' : 'bg-white text-gray-400 border-gray-100 hover:border-indigo-100'}`}
                                            >
                                                <span className="text-xs font-black uppercase tracking-widest">{r}</span>
                                                {newRole === r && <FaCheckCircle className="text-white text-lg" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button className="w-full py-4.5 bg-indigo-600 text-white rounded-[1.5rem] font-black shadow-2xl shadow-indigo-50 mt-4 hover:bg-indigo-700 transition-all text-xs tracking-widest uppercase">
                                    Apply Security Changes
                                </button>
                            </form>
                        </Modal>
                    )
                }
            </div>
        </div>
    );
}
