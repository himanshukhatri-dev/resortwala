import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { FiDatabase, FiDownload, FiRefreshCw, FiAlertTriangle, FiClock, FiShield, FiEye } from 'react-icons/fi';
import Loader from '../../components/Loader';

export default function DbControl() {
    const { token } = useAuth();
    const [backups, setBackups] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('backups');
    const [selectedLog, setSelectedLog] = useState(null);
    const [restoring, setRestoring] = useState(false);
    const [showRestoreModal, setShowRestoreModal] = useState(null); // stores backup object
    const [restoreConfirmText, setRestoreConfirmText] = useState('');

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const headers = { Authorization: `Bearer ${token}` };
            if (activeTab === 'backups') {
                const res = await axios.get(`${API_BASE_URL}/internal/db-control/backups`, { headers });
                setBackups(res.data);
            } else {
                const res = await axios.get(`${API_BASE_URL}/internal/db-control/audit-logs`, { headers });
                setAuditLogs(res.data.data);
            }
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const triggerBackup = async () => {
        if (!window.confirm("Start manual database backup? This will include encryption and compression.")) return;
        try {
            await axios.post(`${API_BASE_URL}/internal/db-control/backups`, { env: 'manual', encrypt: true }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Backup process initiated.");
            fetchData();
        } catch (error) {
            alert("Failed to start backup");
        }
    };

    const downloadBackup = async (id, filename) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/internal/db-control/backups/${id}/download`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
        } catch (error) {
            alert("Download failed");
        }
    };

    const handleRestore = async () => {
        if (restoreConfirmText !== 'RESTORE') {
            alert("Please type RESTORE to confirm.");
            return;
        }

        const backup = showRestoreModal;
        setRestoring(true);
        setShowRestoreModal(null);
        setRestoreConfirmText('');

        try {
            const res = await axios.post(`${API_BASE_URL}/internal/db-control/backups/${backup.id}/restore`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(res.data.message || "Database restored successfully!");
            fetchData();
        } catch (error) {
            console.error("Restore error:", error);
            alert(error.response?.data?.error || "Critical error during restoration.");
        } finally {
            setRestoring(false);
        }
    };

    if (loading && !backups.length && !auditLogs.length) return <Loader message="Accessing Secure Vault..." />;

    return (
        <div className="space-y-6 text-left">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black flex items-center gap-3">
                        <FiShield className="text-indigo-600" /> Disaster Recovery & Audit
                    </h1>
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-widest mt-1">Developer-Only Control Plane</p>
                </div>
                <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                    <button
                        onClick={() => setActiveTab('backups')}
                        className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'backups' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Snapshots
                    </button>
                    <button
                        onClick={() => setActiveTab('audits')}
                        className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'audits' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Change Log
                    </button>
                </div>
            </div>

            {activeTab === 'backups' ? (
                <div className="saas-card p-6">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-lg font-black text-gray-900">Database Backups</h3>
                            <p className="text-gray-400 text-xs font-bold mt-1">30-day retention policy active</p>
                        </div>
                        <button onClick={triggerBackup} className="saas-button-primary flex items-center gap-2">
                            <FiRefreshCw className="animate-spin-slow" /> Trigger Snapshot
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="saas-table">
                            <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>Environment</th>
                                    <th>Size</th>
                                    <th>Status</th>
                                    <th>Encrypted</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {backups.map(b => (
                                    <tr key={b.id} className="hover:bg-gray-50/50">
                                        <td className="font-bold text-gray-900">
                                            <div>{new Date(b.created_at).toLocaleString()}</div>
                                            {b.restored_at && (
                                                <div className="text-[9px] text-indigo-500 font-bold uppercase mt-1 flex items-center gap-1">
                                                    <FiClock /> Last Restored: {new Date(b.restored_at).toLocaleDateString()}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${b.environment === 'production' ? 'bg-red-50 text-red-600 font-black' :
                                                b.environment === 'safety_pre_restore' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {b.environment}
                                            </span>
                                        </td>
                                        <td className="text-gray-400 font-mono text-xs">{(b.size_bytes / 1024 / 1024).toFixed(2)} MB</td>
                                        <td>
                                            {b.status === 'success' ?
                                                <span className="text-emerald-500 flex items-center gap-1 font-black text-[10px] uppercase tracking-wider"><FiDatabase /> Success</span> :
                                                <span className="text-red-500 flex items-center gap-1 font-black text-[10px] uppercase tracking-wider"><FiAlertTriangle /> Failed</span>
                                            }
                                        </td>
                                        <td>{b.is_encrypted ? <span title="Hardened AES-256">🛡️</span> : '❌'}</td>
                                        <td className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => setShowRestoreModal(b)}
                                                    disabled={restoring || b.status !== 'success'}
                                                    className={`p-2.5 rounded-xl transition-all shadow-sm ${restoring ? 'bg-gray-100 text-gray-300' : 'hover:bg-red-600 hover:text-white text-red-400 bg-red-50'}`}
                                                    title="Restore DB to this point"
                                                >
                                                    <FiRefreshCw size={14} className={restoring ? 'animate-spin' : ''} />
                                                </button>
                                                <button onClick={() => downloadBackup(b.id, b.filename)} className="p-2.5 hover:bg-slate-900 hover:text-white text-slate-400 rounded-xl transition-all shadow-sm">
                                                    <FiDownload size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="saas-card p-6">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                <FiClock className="text-indigo-600" /> Granular DB Audit Trail
                            </h3>
                            <p className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">Live Monitoring</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="saas-table">
                                <thead>
                                    <tr>
                                        <th>Timestamp</th>
                                        <th>Resource</th>
                                        <th>Event</th>
                                        <th>Actor</th>
                                        <th>Source IP</th>
                                        <th className="text-right">Inspect</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {auditLogs.map(log => (
                                        <tr key={log.id} className="text-xs hover:bg-gray-50/50">
                                            <td className="text-gray-400">{new Date(log.created_at).toLocaleString()}</td>
                                            <td className="font-mono text-[10px] font-bold text-gray-900">
                                                {log.auditable_type.split('\\').pop()} <span className="text-indigo-400">#{log.auditable_id}</span>
                                            </td>
                                            <td>
                                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tight ${log.event === 'updated' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                                    log.event === 'deleted' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                    }`}>
                                                    {log.event}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-[10px] font-black">{log.user?.name?.charAt(0)}</div>
                                                    <span className="font-bold">{log.user?.name || 'Automated System'}</span>
                                                </div>
                                            </td>
                                            <td className="text-gray-400 font-mono text-[10px]">{log.ip_address}</td>
                                            <td className="text-right">
                                                <button
                                                    onClick={() => setSelectedLog(log)}
                                                    className="p-2 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors"
                                                >
                                                    <FiEye size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Diff Viewer Modal (Simplified) */}
                    {selectedLog && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                            <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
                                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                    <div>
                                        <h3 className="text-xl font-black text-gray-900">Change Details</h3>
                                        <p className="text-xs text-gray-400 font-bold uppercase mt-1">Ref: {selectedLog.auditable_type} #{selectedLog.auditable_id}</p>
                                    </div>
                                    <button onClick={() => setSelectedLog(null)} className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center font-bold text-gray-400 hover:text-gray-900 transition-colors">✕</button>
                                </div>
                                <div className="p-8 overflow-y-auto grid grid-cols-2 gap-8 custom-scrollbar">
                                    <div>
                                        <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-4">Before Change</h4>
                                        <pre className="bg-gray-50 p-6 rounded-2xl text-[10px] font-mono overflow-x-auto border border-gray-100">
                                            {JSON.stringify(selectedLog.old_values, null, 2) || 'N/A (Created)'}
                                        </pre>
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-4">After Change</h4>
                                        <pre className="bg-indigo-50/30 p-6 rounded-2xl text-[10px] font-mono overflow-x-auto border border-indigo-100/50">
                                            {JSON.stringify(selectedLog.new_values, null, 2) || 'N/A (Deleted)'}
                                        </pre>
                                    </div>
                                </div>
                                <div className="p-6 bg-gray-50/50 border-t border-gray-100 text-center">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Immutable Log Captured at {new Date(selectedLog.created_at).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Restore Safety Modal */}
            {showRestoreModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-6 text-left">
                    <div className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden flex flex-col shadow-2xl">
                        <div className="p-8 bg-red-50 border-b border-red-100">
                            <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center text-white mb-4 shadow-lg shadow-red-200">
                                <FiAlertTriangle size={24} />
                            </div>
                            <h3 className="text-xl font-black text-red-900">Critical: Restore Database?</h3>
                            <p className="text-sm text-red-700 font-medium mt-1">
                                You are about to overwrite the current database with the snapshot from <b>{new Date(showRestoreModal.created_at).toLocaleString()}</b>.
                            </p>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-start gap-3">
                                <div className="p-2 bg-white rounded-lg border border-gray-200 text-indigo-600">
                                    <FiDatabase size={16} />
                                </div>
                                <div className="text-[10px] text-gray-500 leading-relaxed font-bold uppercase tracking-tight">
                                    A <span className="text-amber-600">safety_pre_restore</span> backup will be created before the operation starts.
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Type "RESTORE" to continue</label>
                                <input
                                    type="text"
                                    value={restoreConfirmText}
                                    onChange={(e) => setRestoreConfirmText(e.target.value.toUpperCase())}
                                    placeholder="RESTORE"
                                    className="w-full px-5 py-3 bg-gray-50 border-2 border-transparent focus:border-red-600 focus:bg-white rounded-xl outline-none transition-all font-mono font-black text-center tracking-[0.2em]"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setShowRestoreModal(null); setRestoreConfirmText(''); }}
                                    className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRestore}
                                    disabled={restoreConfirmText !== 'RESTORE'}
                                    className={`flex-1 py-3 font-bold rounded-xl transition-all ${restoreConfirmText === 'RESTORE' ? 'bg-red-600 text-white shadow-lg shadow-red-200' : 'bg-red-100 text-red-300 cursor-not-allowed'}`}
                                >
                                    Confirm Restore
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Global Restoring Overlay */}
            {restoring && (
                <div className="fixed inset-0 bg-white/90 backdrop-blur-xl z-[100] flex flex-col items-center justify-center p-12 text-center">
                    <div className="w-20 h-20 rounded-3xl bg-indigo-600 flex items-center justify-center text-white mb-8 shadow-2xl shadow-indigo-200 animate-bounce">
                        <FiRefreshCw size={32} className="animate-spin-slow" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 mb-2">Restoration in Progress</h2>
                    <p className="text-gray-500 font-medium max-w-sm">
                        Overwriting core database tables. Do not close this tab or refresh the page.
                    </p>
                    <div className="mt-12 w-64 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 animate-pulse" style={{ width: '60%' }}></div>
                    </div>
                </div>
            )}
        </div>
    );
}
