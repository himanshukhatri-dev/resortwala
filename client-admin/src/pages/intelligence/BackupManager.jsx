import { useState, useEffect } from 'react';
import { FaHdd, FaDownload, FaTrash, FaUndo, FaPlus, FaExclamationTriangle } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';

export default function BackupManager() {
    const { token } = useAuth();
    const [backups, setBackups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);

    // Restore Modal State
    const [restoreFile, setRestoreFile] = useState(null);
    const [confirmPhrase, setConfirmPhrase] = useState('');

    useEffect(() => {
        fetchBackups();
    }, []);

    const fetchBackups = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/intelligence/backups`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setBackups(res.data.backups);
            }
        } catch (err) {
            console.error("Failed to fetch backups", err);
        } finally {
            setLoading(false);
        }
    };

    const createBackup = async () => {
        setCreating(true);
        try {
            await axios.post(`${API_BASE_URL}/admin/intelligence/backups`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchBackups();
        } catch (err) {
            alert("Failed to create backup: " + (err.response?.data?.error || err.message));
        } finally {
            setCreating(false);
        }
    };

    const deleteBackup = async (filename) => {
        if (!confirm(`Delete backup ${filename}?`)) return;
        try {
            await axios.delete(`${API_BASE_URL}/admin/intelligence/backups/${filename}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBackups(prev => prev.filter(b => b.name !== filename));
        } catch (err) {
            alert("Failed to delete backup");
        }
    };

    const downloadBackup = (filename) => {
        // Direct download link
        const url = `${API_BASE_URL}/admin/intelligence/backups/${filename}/download?token=${token}`;
        // Since we need auth header usually, but for download we might need a temporal token or just native axios blob download.
        // Let's use axios blob.
        axios({
            url: `${API_BASE_URL}/admin/intelligence/backups/${filename}/download`,
            method: 'GET',
            responseType: 'blob',
            headers: { Authorization: `Bearer ${token}` }
        }).then((response) => {
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
        }).catch(err => alert("Download failed"));
    };

    const handleRestore = async () => {
        if (confirmPhrase !== 'RESTORE DB') {
            alert("Please type 'RESTORE DB' to confirm.");
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/admin/intelligence/backups/${restoreFile.name}/restore`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Database Restored Successfully!");
            setRestoreFile(null);
            setConfirmPhrase('');
        } catch (err) {
            alert("Restore Failed: " + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex items-center justify-between bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <FaHdd className="text-blue-600" /> System Backups
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Manage database snapshots and recovery points.</p>
                </div>
                <button
                    onClick={createBackup}
                    disabled={creating}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20"
                >
                    {creating ? <span className="animate-spin">⏳</span> : <FaPlus />}
                    Create New Backup
                </button>
            </div>

            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                <div className="overflow-y-auto flex-1">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Filename</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Created At</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Size</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {backups.map(backup => (
                                <tr key={backup.name} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-mono text-gray-700">{backup.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{backup.date}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">{backup.size}</td>
                                    <td className="px-6 py-4 text-right flex items-center justify-end gap-3">
                                        <button
                                            onClick={() => downloadBackup(backup.name)}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Download"
                                        >
                                            <FaDownload />
                                        </button>
                                        <button
                                            onClick={() => setRestoreFile(backup)}
                                            className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                            title="Restore"
                                        >
                                            <FaUndo />
                                        </button>
                                        <button
                                            onClick={() => deleteBackup(backup.name)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {backups.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                                        No backups found. Create one to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Restore Confirmation Modal */}
            {restoreFile && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="bg-red-50 p-6 border-b border-red-100 flex items-center gap-4">
                            <div className="p-3 bg-red-100 rounded-full text-red-600">
                                <FaExclamationTriangle className="text-xl" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-red-900">Database Restoration</h3>
                                <p className="text-sm text-red-700">This action is destructive and irreversible.</p>
                            </div>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-600 text-sm mb-4">
                                You are about to restore <strong>{restoreFile.name}</strong>.
                                This will <u>overwrite</u> all current data in the active database.
                            </p>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                                Type "RESTORE DB" to confirm
                            </label>
                            <input
                                type="text"
                                value={confirmPhrase}
                                onChange={(e) => setConfirmPhrase(e.target.value)}
                                className="w-full border-2 border-red-100 rounded-xl px-4 py-2 text-red-900 font-bold focus:border-red-500 focus:outline-none placeholder-red-200"
                                placeholder="RESTORE DB"
                            />
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setRestoreFile(null)}
                                    className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRestore}
                                    disabled={confirmPhrase !== 'RESTORE DB' || loading}
                                    className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-red-600/20"
                                >
                                    {loading ? 'Restoring...' : 'Restore Database'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
