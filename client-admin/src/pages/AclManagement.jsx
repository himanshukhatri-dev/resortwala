import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { API_BASE_URL } from '../config';
import { FiShield, FiUsers, FiSave, FiAlertCircle, FiCheck, FiX } from 'react-icons/fi';

export default function AclManagement() {
    const { token } = useAuth();
    const { showSuccess, showError } = useModal();
    const [activeTab, setActiveTab] = useState('roles');
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState({});
    const [users, setUsers] = useState([]);
    const [availableRoles, setAvailableRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'roles') {
                const res = await axios.get(`${API_BASE_URL}/admin/acl/matrix`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setRoles(res.data.roles);
                setPermissions(res.data.permissions);
            } else {
                const res = await axios.get(`${API_BASE_URL}/admin/acl/users`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUsers(res.data.users);
                setAvailableRoles(res.data.available_roles);
            }
        } catch (err) {
            console.error('Failed to fetch ACL data:', err);
            showError('Failed to load ACL data');
        } finally {
            setLoading(false);
        }
    };

    const handlePermissionToggle = async (roleId, permissionName) => {
        const role = roles.find(r => r.id === roleId);
        const hasPermission = role.permissions.some(p => p.name === permissionName);

        const newPermissions = hasPermission
            ? role.permissions.filter(p => p.name !== permissionName).map(p => p.name)
            : [...role.permissions.map(p => p.name), permissionName];

        try {
            setSaving(true);
            await axios.put(`${API_BASE_URL}/admin/acl/roles/${roleId}/permissions`, {
                permissions: newPermissions
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Local state update
            setRoles(roles.map(r => {
                if (r.id === roleId) {
                    return {
                        ...r,
                        permissions: hasPermission
                            ? r.permissions.filter(p => p.name !== permissionName)
                            : [...r.permissions, { name: permissionName }]
                    };
                }
                return r;
            }));

            showSuccess('Permissions updated');
        } catch (err) {
            showError('Failed to update permissions');
        } finally {
            setSaving(false);
        }
    };

    const handleUserRoleChange = async (userId, newRole) => {
        try {
            await axios.post(`${API_BASE_URL}/admin/acl/users/${userId}/role`, {
                role: newRole
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setUsers(users.map(u => u.id === userId ? { ...u, roles: [{ name: newRole }] } : u));
            showSuccess(`User assigned to ${newRole}`);
        } catch (err) {
            showError('Failed to update user role');
        }
    };

    if (loading) return <div className="p-10 text-center">Loading ACL...</div>;

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <FiShield className="text-indigo-600" />
                    Access Control Layer (ACL)
                </h1>
                <p className="text-gray-500 mt-1">Manage roles, permissions, and user access across the system.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-100">
                <button
                    onClick={() => setActiveTab('roles')}
                    className={`px-4 py-2 font-bold text-sm transition-all ${activeTab === 'roles' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    Roles & Permission Matrix
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    className={`px-4 py-2 font-bold text-sm transition-all ${activeTab === 'users' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    User Assignments
                </button>
            </div>

            {activeTab === 'roles' ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="p-4 text-xs font-black uppercase text-gray-500 border-b">Module / Permission</th>
                                    {roles.map(role => (
                                        <th key={role.id} className="p-4 text-xs font-black uppercase text-gray-700 border-b text-center">
                                            {role.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(permissions).map(([module, perms]) => (
                                    <React.Fragment key={module}>
                                        <tr className="bg-indigo-50/30">
                                            <td colSpan={roles.length + 1} className="p-2 px-4 text-[10px] font-black uppercase text-indigo-600 tracking-widest">
                                                {module}
                                            </td>
                                        </tr>
                                        {perms.map(p => (
                                            <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="p-4 border-b">
                                                    <div className="text-sm font-bold text-gray-800">{p.name.split('.')[1].replace('_', ' ')}</div>
                                                    <div className="text-[10px] text-gray-400 font-mono">{p.name}</div>
                                                </td>
                                                {roles.map(role => {
                                                    const isDeveloper = role.name === 'Developer';
                                                    const hasPerm = role.permissions.some(rp => rp.name === p.name);

                                                    return (
                                                        <td key={`${role.id}-${p.name}`} className="p-4 border-b text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={hasPerm || isDeveloper}
                                                                disabled={isDeveloper || saving}
                                                                onChange={() => handlePermissionToggle(role.id, p.name)}
                                                                className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 transition-all disabled:opacity-50 cursor-pointer"
                                                            />
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="p-4 text-xs font-black uppercase text-gray-500 border-b">User</th>
                                <th className="p-4 text-xs font-black uppercase text-gray-500 border-b">Current Role</th>
                                <th className="p-4 text-xs font-black uppercase text-gray-500 border-b text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 border-b">
                                        <div className="font-bold text-gray-800">{user.name}</div>
                                        <div className="text-xs text-gray-500">{user.email}</div>
                                    </td>
                                    <td className="p-4 border-b">
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-tight
                                            ${user.roles?.[0]?.name === 'Developer' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}
                                        `}>
                                            {user.roles?.[0]?.name || 'No Role'}
                                        </span>
                                    </td>
                                    <td className="p-4 border-b text-right">
                                        <select
                                            value={user.roles?.[0]?.name || ''}
                                            onChange={(e) => handleUserRoleChange(user.id, e.target.value)}
                                            className="text-xs border-gray-200 rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        >
                                            <option value="" disabled>Select Role</option>
                                            {availableRoles.map(role => (
                                                <option key={role} value={role}>{role}</option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3 items-start">
                <FiAlertCircle className="text-amber-500 mt-0.5" />
                <div className="text-xs text-amber-700 leading-relaxed font-medium">
                    <strong>Note:</strong> Permissions are reactive. Users in the 'Developer' role automatically have all permissions and cannot be modified. Role changes take effect on the next page refresh or login for the target user.
                </div>
            </div>
        </div>
    );
}

import React from 'react'; // React import to fix Fragment
