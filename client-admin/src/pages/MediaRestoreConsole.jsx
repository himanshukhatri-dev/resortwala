import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaShieldAlt, FaHistory, FaUndo, FaCheckCircle, FaExclamationTriangle, FaWater, FaSpinner, FaTimes } from 'react-icons/fa';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const MediaRestoreConsole = () => {
    const { token } = useAuth();
    const [backups, setBackups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, verified: 0 });
    const [processing, setProcessing] = useState(false);
    const [compareData, setCompareData] = useState(null);
    const [showCompare, setShowCompare] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);

    // Fetch Backups
    const fetchBackups = async () => {
        try {
            const [resBackups, resStats] = await Promise.all([
                axios.get(`${API_BASE_URL}/admin/media/backups`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_BASE_URL}/admin/media/stats`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            setBackups(resBackups.data.data);
            setStats({
                verified: resBackups.data.data.filter(b => b.status === 'verified').length,
                total: resStats.data.total_images,
                protected: resStats.data.protected_images,
                coverage: resStats.data.coverage_percent
            });
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBackups();
    }, [token]);

    // Actions
    const handleCompare = async (imageId) => {
        const toastId = toast.loading("Loading Comparison...");
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/media/compare/${imageId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCompareData(res.data);
            setShowCompare(true);
            toast.dismiss(toastId);
        } catch (err) {
            toast.error("Failed to load images", { id: toastId });
        }
    };

    const handleRestore = async (id) => {
        if (!window.confirm("CRITICAL: This will overwrite the current live image with the backup. Proceed?")) return;

        try {
            await axios.post(`${API_BASE_URL}/admin/media/restore/${id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Image Restored Successfully");
            fetchBackups();
            // fetchStats(); // fetchBackups already fetches stats
        } catch (err) {
            toast.error(err.response?.data?.error || "Restore Failed");
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === backups.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(backups.map(b => b.id));
        }
    };

    const handleBatchRestore = async () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm(`Are you sure you want to restore ${selectedIds.length} images?`)) return;

        const toastId = toast.loading(`Restoring ${selectedIds.length} images...`);
        try {
            await axios.post(`${API_BASE_URL}/admin/media/restore-batch`, { ids: selectedIds }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`Restored ${selectedIds.length} images`, { id: toastId });
            fetchBackups(); // Refresh all backups and stats
            setSelectedIds([]);
        } catch (err) {
            toast.error("Batch restore failed", { id: toastId });
        }
    };

    const handleBatchProtect = async () => {
        if (selectedIds.length === 0) return;
        // Map backup IDs back to Image IDs using the backups data
        const imageIds = backups.filter(b => selectedIds.includes(b.id)).map(b => b.image_id);

        if (!window.confirm(`Re-Apply Watermark to ${imageIds.length} images? This will overwrite them again.`)) return;

        const toastId = toast.loading("Queuing Watermark Job...");
        try {
            await axios.post(`${API_BASE_URL}/admin/media/watermark-batch`, { ids: imageIds, sync: true }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Watermark Applied Successfully!", { id: toastId });
            fetchBackups();
            setSelectedIds([]);
        } catch (err) {
            toast.error("Failed to apply watermark", { id: toastId });
        }
    };

    const handlePurge = async () => {
        if (!window.confirm("DANGER: This will delete ALL original backup files (Audit History). This cannot be undone.\n\nOnly do this if you are satisfied with the current watermarked images.")) return;

        const toastId = toast.loading("Purging History...");
        try {
            const res = await axios.delete(`${API_BASE_URL}/admin/media/backups`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(res.data.message, { id: toastId });
            fetchBackups();
            // fetchStats(); // fetchBackups already fetches stats
        } catch (err) {
            console.error(err);
            toast.error("Purge Failed", { id: toastId });
        }
    };

    const handleTriggerWatermark = async () => {
        if (!window.confirm("SAFETY CHECK: This will backup and watermark 100 images. Are you sure?")) return;

        setProcessing(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/admin/media/watermark-batch`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`Batch Started: ${res.data.count} images queued`);
        } catch (err) {
            toast.error("Failed to trigger batch");
        } finally {
            setProcessing(false);
        }
    };

    const handleDebug = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/media/debug-watermark`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Watermark Debug Success:\n" + JSON.stringify(res.data, null, 2));
        } catch (err) {
            alert("Watermark Debug Failed:\n" + JSON.stringify(err.response?.data || err.message, null, 2));
        }
    };

    const handleDebugVoice = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/media/debug-tts`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Voice Debug Log:\n" + JSON.stringify(res.data, null, 2));
        } catch (err) {
            alert("Voice Debug Failed:\n" + JSON.stringify(err.response?.data || err.message, null, 2));
        }
    };

    return (
        <div className="p-6">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FaShieldAlt className="text-indigo-600" /> SRE Media Console
                    </h1>
                    <p className="text-gray-500">Zero-Loss Backup & Watermark Management System</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleDebug}
                        className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-xs font-bold flex items-center gap-1"
                        title="Debug Watermark System"
                    >
                        <FaExclamationTriangle /> Debug Img
                    </button>
                    <button
                        onClick={handleDebugVoice}
                        className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs font-bold flex items-center gap-1"
                        title="Debug AI Voice System"
                    >
                        <FaExclamationTriangle /> Debug Voice
                    </button>
                    <button
                        onClick={fetchBackups}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600"
                    >
                        Refresh Log
                    </button>
                    <button
                        onClick={handleTriggerWatermark}
                        disabled={processing}
                        className={`px-6 py-2 bg-pink-600 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-pink-700 transition ${processing ? 'opacity-50' : ''}`}
                    >
                        {processing ? <FaSpinner className="animate-spin" /> : <FaWater />}
                        Run Watermark Batch (Safe)
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 text-green-600 rounded-lg"><FaCheckCircle /></div>
                        <h3 className="font-bold text-gray-700">Protected Coverage</h3>
                    </div>
                    <div className="flex items-end gap-2">
                        <p className="text-3xl font-bold">{stats.protected || 0} <span className="text-sm text-gray-400 font-normal">/ {stats.total || 0}</span></p>
                        <p className="text-sm font-bold text-green-500 mb-1">({stats.coverage || 0}%)</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Images Watermarked & Backed Up</p>
                </div>
                {/* Add more stats if needed */}
            </div>

            {/* Backup Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                        <FaHistory /> Audit Log & Restore
                    </h3>
                    <div className="flex gap-3">
                        {selectedIds.length > 0 && (
                            <>
                                <button
                                    onClick={handleBatchRestore}
                                    className="text-xs bg-green-100 text-green-600 px-3 py-1 rounded font-bold hover:bg-green-200 transition flex items-center gap-1"
                                >
                                    <FaUndo /> Restore Selected ({selectedIds.length})
                                </button>
                                <button
                                    onClick={handleBatchProtect}
                                    className="text-xs bg-pink-100 text-pink-600 px-3 py-1 rounded font-bold hover:bg-pink-200 transition flex items-center gap-1"
                                >
                                    <FaWater /> Protect ({selectedIds.length})
                                </button>
                            </>
                        )}
                        {backups.length > 0 && (
                            <button
                                onClick={handlePurge}
                                className="text-xs text-red-500 underline hover:text-red-700 font-bold"
                                title="Delete all original backups (Keep current watermarked versions)"
                            >
                                Purge History
                            </button>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading records...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                                <tr>
                                    <th className="p-2 border-b w-10">
                                        <input type="checkbox" checked={backups.length > 0 && selectedIds.length === backups.length} onChange={toggleSelectAll} className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500" />
                                    </th>
                                    <th className="p-2">Time</th>
                                    <th className="p-2 hidden md:table-cell">Batch ID</th>
                                    <th className="p-2">Image</th>
                                    <th className="p-2 hidden lg:table-cell">Checksum</th>
                                    <th className="p-2">Status</th>
                                    <th className="p-2 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {backups.map(record => (
                                    <tr key={record.id} className="hover:bg-gray-50 transition">
                                        <td className="p-2 border-b">
                                            <input type="checkbox" checked={selectedIds.includes(record.id)} onChange={() => toggleSelect(record.id)} className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500" />
                                        </td>
                                        <td className="p-2 text-gray-600 whitespace-nowrap text-xs">
                                            {new Date(record.created_at).toLocaleString()}
                                        </td>
                                        <td className="p-2 font-mono text-xs text-indigo-600 hidden md:table-cell">
                                            {record.backup_batch_id}
                                        </td>
                                        <td className="p-2 max-w-[150px]">
                                            <div className="font-medium text-gray-900 truncate" title={record.original_path}>{record.original_path}</div>
                                            <div className="text-[10px] text-gray-400">ID: {record.image_id}</div>
                                        </td>
                                        <td className="p-2 font-mono text-[10px] text-gray-500 hidden lg:table-cell">
                                            {record.checksum ? record.checksum.substring(0, 7) : '-'}
                                        </td>
                                        <td className="p-2">
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase
                                                ${record.status === 'verified' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                                {record.status}
                                            </span>
                                        </td>
                                        <td className="p-2 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => handleCompare(record.image_id)}
                                                    className="p-1 px-2 border border-indigo-200 text-indigo-600 rounded bg-indigo-50 hover:bg-indigo-100 flex items-center gap-1 text-[10px] font-bold"
                                                    title="Compare"
                                                >
                                                    <FaHistory /> Cmp
                                                </button>
                                                <button
                                                    onClick={() => handleRestore(record.id)}
                                                    className="p-1 px-2 border border-red-200 text-red-600 rounded bg-red-50 hover:bg-red-100 flex items-center gap-1 text-[10px] font-bold"
                                                    title="Restore"
                                                >
                                                    <FaUndo /> Rst
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {backups.length === 0 && (
                                    <tr><td colSpan="6" className="p-8 text-center text-gray-400">No backup records found. Trigger a batch to start.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Compare Modal */}
            {showCompare && compareData && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg">Image Comparison Inspection</h3>
                            <button onClick={() => setShowCompare(false)} className="bg-gray-200 p-2 rounded-full hover:bg-gray-300"><FaTimes /></button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="grid grid-cols-2 gap-8 h-full">
                                {/* Left: Backup */}
                                <div className="border border-red-200 rounded-xl p-4 bg-red-50/30">
                                    <div className="flex justify-between mb-2">
                                        <span className="font-bold text-red-600 uppercase text-xs tracking-wider">Before (Original Backup)</span>
                                        <span className="text-xs text-gray-500">{compareData.backup_date}</span>
                                    </div>
                                    <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden relative">
                                        {compareData.backup_url ? (
                                            <img src={compareData.backup_url} className="w-full h-full object-contain" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-400">No Backup Found</div>
                                        )}
                                    </div>
                                    <div className="mt-2 text-center">
                                        <a href={compareData.backup_url} target="_blank" className="text-xs text-blue-600 underline">Open Original</a>
                                    </div>
                                </div>

                                {/* Right: Live */}
                                <div className="border border-green-200 rounded-xl p-4 bg-green-50/30">
                                    <div className="flex justify-between mb-2">
                                        <span className="font-bold text-green-600 uppercase text-xs tracking-wider">After (Live on Site)</span>
                                        <span className="text-xs text-green-700 bg-green-100 px-2 rounded-full">Live</span>
                                    </div>
                                    <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden relative">
                                        <img src={`${compareData.live_url}${compareData.live_url.includes('?') ? '&' : '?'}t=${Date.now()}`} className="w-full h-full object-contain" />
                                    </div>
                                    <div className="mt-2 text-center flex gap-4 justify-center">
                                        <a href={`${compareData.live_url}${compareData.live_url.includes('?') ? '&' : '?'}t=${Date.now()}`} target="_blank" className="text-xs text-blue-600 underline">Open Image</a>
                                        <a href={compareData.website_url} target="_blank" className="text-xs font-bold text-indigo-600 underline">View Property on Site</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MediaRestoreConsole;
