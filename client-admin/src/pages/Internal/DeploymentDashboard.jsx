import React, { useState, useEffect } from 'react';
import { FiServer, FiGitCommit, FiPlay, FiRefreshCw, FiClock, FiCheckCircle, FiXCircle, FiAlertTriangle } from 'react-icons/fi';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

export default function DeploymentDashboard() {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [deploying, setDeploying] = useState(false);
    const [statusInterval, setStatusInterval] = useState(null);

    const fetchData = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/internal/deployment`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load deployment status");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Auto-refresh data every 10 seconds if a build is running
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleDeploy = async (target) => {
        if (!window.confirm(`Are you sure you want to deploy to ${target}?`)) return;

        setDeploying(true);
        try {
            await axios.post(`${API_BASE_URL}/internal/deployment/deploy`,
                { target },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(`Deployment to ${target} queued successfully.`);
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Deployment failed to start");
        } finally {
            setDeploying(false);
        }
    };

    const handleRollback = async () => {
        if (!window.confirm(`⚠️ CRITICAL: Are you sure you want to trigger a Rollback? This should only be used in emergencies.`)) return;
        alert("Rollback is not fully automated via UI yet. Please contact DevOps or run rollback.sh on server.");
    };

    const getStatusColor = (status) => {
        if (status === 'SUCCESS') return 'text-green-600 bg-green-50';
        if (status === 'FAILURE') return 'text-red-600 bg-red-50';
        if (status === 'BUILDING') return 'text-blue-600 bg-blue-50 animate-pulse';
        return 'text-gray-600 bg-gray-50';
    };

    if (loading) return <div className="p-10 text-center">Loading Deployment Status...</div>;

    const jenkins = data?.jenkins || {};

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Deployment Center</h1>
                    <p className="text-sm text-gray-500">Manage releases, CI/CD pipelines, and environment status.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchData}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                        title="Refresh Status"
                    >
                        <FiRefreshCw />
                    </button>
                    <button
                        onClick={() => handleDeploy('Beta')}
                        disabled={deploying}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                        <FiPlay /> Deploy to Beta
                    </button>
                    <button
                        onClick={() => handleDeploy('Production')}
                        disabled={deploying}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-bold"
                    >
                        <FiServer /> Promote to Production
                    </button>
                </div>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Environment Info */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                            <FiServer size={20} />
                        </div>
                        <h3 className="font-bold text-gray-700">Environment</h3>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Current Env:</span>
                            <span className="font-mono font-bold">{data?.environment}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Live Version:</span>
                            <span className="font-mono bg-gray-100 px-2 rounded">{data?.current_version}</span>
                        </div>
                    </div>
                </div>

                {/* Pipeline Status */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <FiGitCommit size={20} />
                        </div>
                        <h3 className="font-bold text-gray-700">Pipeline Status</h3>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <div className="text-xs text-gray-500 uppercase font-bold mb-1">Queue Status</div>
                            {jenkins.in_queue ? (
                                <span className="inline-flex items-center gap-2 px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-bold">
                                    <FiClock /> In Queue
                                </span>
                            ) : (
                                <span className="text-xs text-gray-400">Idle</span>
                            )}
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 uppercase font-bold mb-1">Last Build</div>
                            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getStatusColor(jenkins.last_status)}`}>
                                {jenkins.last_status === 'SUCCESS' && <FiCheckCircle />}
                                {jenkins.last_status === 'FAILURE' && <FiXCircle />}
                                {jenkins.last_status === 'BUILDING' && <FiRefreshCw className="animate-spin" />}
                                <span className="font-bold text-sm">#{jenkins.last_build} - {jenkins.last_status}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Rollback Control */}
                <div className="bg-white p-6 rounded-xl border border-red-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 text-red-100">
                        <FiAlertTriangle size={60} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                                <FiAlertTriangle size={20} />
                            </div>
                            <h3 className="font-bold text-red-700">Emergency Zone</h3>
                        </div>
                        <p className="text-xs text-red-600 mb-4">
                            Only use this if the current deployment is broken. This will revert the site to the previous release.
                        </p>
                        <button
                            onClick={handleRollback}
                            className="w-full py-2 bg-white border-2 border-red-200 text-red-600 font-bold rounded-lg hover:bg-red-50 transition-colors"
                        >
                            Trigger Rollback
                        </button>
                    </div>
                </div>
            </div>

            {/* Build History */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-gray-700">Recent Build History</h3>
                </div>
                <div className="divide-y divide-gray-100">
                    {data?.history?.map((build) => (
                        <div key={build.number} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`w-2 h-2 rounded-full ${build.result === 'SUCCESS' ? 'bg-green-500' : build.result === 'FAILURE' ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                                <div>
                                    <div className="font-mono font-bold text-sm text-gray-800">Build #{build.number}</div>
                                    <div className="text-xs text-gray-500">{new Date(build.timestamp).toLocaleString()}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`text-xs font-bold px-2 py-1 rounded ${getStatusColor(build.result)}`}>
                                    {build.result || 'IN PROGRESS'}
                                </span>
                                <a href={build.url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline text-xs">
                                    View Logs
                                </a>
                            </div>
                        </div>
                    ))}
                    {(!data?.history || data.history.length === 0) && (
                        <div className="p-8 text-center text-gray-400 italic">No build history found.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
