import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { FaServer, FaDatabase, FaShieldAlt, FaFileAlt, FaCheckCircle, FaTimesCircle, FaExclamationTriangle } from 'react-icons/fa';

export default function DeveloperConsole() {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const token = localStorage.getItem('admin_token');
                const response = await axios.get(`${API_BASE_URL}/admin/developer/report`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setReport(response.data);
            } catch (error) {
                console.error('Failed to fetch developer report:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchReport();
    }, []);

    if (loading) return <div className="p-10 text-center animate-pulse">Gathering diagnostic data...</div>;
    if (!report) return <div className="p-10 text-center text-red-500">Failed to load system report.</div>;

    const StatusIcon = ({ status }) => status ? <FaCheckCircle className="text-green-500" /> : <FaTimesCircle className="text-red-500" />;

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-black text-gray-900">Developer Diagnostic Console</h2>
                    <p className="text-sm text-gray-500 font-medium">Full stack integrity check and environment overview</p>
                </div>
                <div className="bg-gray-100 px-4 py-2 rounded-lg font-mono text-xs font-bold text-gray-600">
                    STATUS: {report.database.status}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* SYSTEM INFO */}
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                        <FaServer /> System Runtime
                    </h3>
                    <div className="space-y-4">
                        {Object.entries(report.system).map(([key, val]) => (
                            <div key={key} className="flex justify-between items-center border-b border-gray-200/50 pb-2">
                                <span className="text-xs font-bold text-gray-500 capitalize">{key.replace('_', ' ')}</span>
                                <span className="text-xs font-black text-gray-900">{String(val)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* DATABASE */}
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                        <FaDatabase /> Data Layer
                    </h3>
                    <div className="space-y-4">
                        {Object.entries(report.database).map(([key, val]) => (
                            <div key={key} className="flex justify-between items-center border-b border-gray-200/50 pb-2">
                                <span className="text-xs font-bold text-gray-500 capitalize">{key}</span>
                                <span className="text-xs font-black text-gray-900">{val}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* SDKs & EXTERNAL */}
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                        <FaShieldAlt /> SDK Integrity
                    </h3>
                    <div className="space-y-6">
                        {Object.entries(report.sdks).map(([sdk, data]) => (
                            <div key={sdk} className="space-y-2">
                                <h4 className="text-[10px] font-black uppercase text-indigo-600 mb-2">{sdk} Configuration</h4>
                                {Object.entries(data).map(([key, val]) => (
                                    <div key={key} className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-100">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase">{key.replace('_', ' ')}</span>
                                        <div className="flex items-center gap-2">
                                            {typeof val === 'boolean' ? <StatusIcon status={val} /> : <span className="text-[10px] font-black text-gray-900 truncate max-w-[150px]">{String(val)}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                {/* STORAGE */}
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                        <FaFileAlt /> Storage & Permissions
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100">
                            <span className="text-xs font-bold text-gray-700">Public Asset Symlink</span>
                            <StatusIcon status={report.storage.public_link} />
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            {Object.entries(report.storage.writable_paths).map(([path, status]) => (
                                <div key={path} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100">
                                    <span className="text-[10px] font-black uppercase text-gray-500">Writable: {path}</span>
                                    <StatusIcon status={status} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* RECENT LOGS */}
            <div className="bg-slate-900 rounded-2xl border border-slate-700 p-4 mt-6 overflow-hidden">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                    <FaFileAlt /> Recent Server Exception Logs (Tail 100)
                </h3>
                <div className="max-h-[500px] overflow-auto custom-scrollbar bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <pre className="text-[10px] text-emerald-400 font-mono leading-relaxed whitespace-pre-wrap">
                        {report.recent_logs}
                    </pre>
                </div>
            </div>

            {report.sdks.phonepe.in_lock_file === false && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-start gap-4">
                    <FaExclamationTriangle className="text-red-600 text-xl mt-1" />
                    <div>
                        <h4 className="text-red-900 font-bold mb-1">Critical Issue: PhonePe SDK Missing from composer.lock</h4>
                        <p className="text-red-700 text-xs">The server will not be able to install dependencies correctly. Please run <code>composer update --lock</code> locally and redeploy.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
