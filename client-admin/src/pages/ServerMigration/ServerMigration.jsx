import React, { useState } from 'react';
import { FaServer, FaCheck, FaExclamationTriangle, FaArrowRight, FaDatabase, FaFolderOpen, FaNetworkWired } from 'react-icons/fa';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

// Steps
const STEP_CONNECT = 'connect';
const STEP_SCAN = 'scan';
const STEP_SELECT = 'select';
const STEP_MIGRATE = 'migrate';
const STEP_COMPLETE = 'complete';

export default function ServerMigration() {
    const { token } = useAuth();
    const [step, setStep] = useState(STEP_CONNECT);
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState([]);

    // Connection State
    const [connection, setConnection] = useState({
        ip: '',
        user: 'root',
        status: 'idle', // idle, verified, error
        sudo_access: false
    });

    // SSH Key State
    const [sshKeys, setSshKeys] = useState(null);

    // Scan Data
    const [scanData, setScanData] = useState(null);

    const addLog = (msg, type = 'info') => {
        setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg, type }]);
    };

    const handleGenerateKeys = async () => {
        setLoading(true);
        addLog('Generating SSH Keys...', 'info');
        try {
            const { data } = await axios.post(`${API_BASE_URL}/admin/server-migration/keys`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSshKeys(data);
            addLog('SSH Keys Generated Successfully', 'success');
            toast.success('SSH Keys Generated');
        } catch (error) {
            addLog('Failed to generate keys: ' + (error.response?.data?.message || error.message), 'error');
            toast.error('Key Gen Failed');
        } finally {
            setLoading(false);
        }
    };

    const handleTestConnection = async () => {
        if (!connection.ip || !connection.user) return toast.error("IP and User required");

        setLoading(true);
        addLog(`Connecting to ${connection.user}@${connection.ip}...`, 'info');

        try {
            const { data } = await axios.post(`${API_BASE_URL}/admin/server-migration/connect`, {
                ip: connection.ip,
                user: connection.user
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.status === 'success') {
                setConnection(prev => ({ ...prev, status: 'verified', sudo_access: data.sudo_check }));
                addLog('Connection Verified!', 'success');
                if (data.sudo_check) addLog('Sudo Access Confirmed', 'success');
                else addLog('Warning: No Passwordl-ess Sudo Detected', 'warning');

                setStep(STEP_SCAN);
            }
        } catch (error) {
            setConnection(prev => ({ ...prev, status: 'error' }));
            const msg = error.response?.data?.message || error.message;
            addLog('Connection Failed: ' + msg, 'error');
            if (error.response?.data?.debug) {
                addLog('Debug: ' + error.response.data.debug, 'error');
            }
            toast.error('Connection Failed');
        } finally {
            setLoading(false);
        }
    };

    // Trigger scan when entering SCAN step
    React.useEffect(() => {
        if (step === STEP_SCAN && !scanData) {
            handleScan();
        }
    }, [step]);

    const handleScan = async () => {
        setLoading(true);
        addLog('Starting Remote Server Scan...', 'info');

        try {
            const { data } = await axios.post(`${API_BASE_URL}/admin/server-migration/scan`, {
                ip: connection.ip,
                user: connection.user
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.status === 'success') {
                setScanData(data);
                addLog('Scan Complete. Found ' + data.databases.length + ' DBs and ' + data.nginx.length + ' Sites.', 'success');
            }
        } catch (error) {
            const msg = error.response?.data?.message || error.message;
            addLog('Scan Failed: ' + msg, 'error');
            toast.error('Scan Failed');
            setStep(STEP_CONNECT); // Go back
        } finally {
            setLoading(false);
        }
    };

    const renderScanResults = () => {
        if (!scanData) return <div className="p-10 text-center text-gray-400">Waiting for scan data...</div>;

        return (
            <div className="space-y-6">
                {/* System Info */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <span className="text-xs uppercase font-bold text-blue-500">OS</span>
                        <p className="font-bold text-gray-800">{scanData.system.os}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                        <span className="text-xs uppercase font-bold text-purple-500">PHP Version</span>
                        <p className="font-bold text-gray-800">{scanData.system.php}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                        <span className="text-xs uppercase font-bold text-green-500">Web Disk Usage</span>
                        <p className="font-bold text-gray-800">{scanData.disk.www_size}</p>
                    </div>
                </div>

                {/* Databases */}
                <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-gray-50 px-4 py-2 border-b font-bold text-xs uppercase text-gray-500 flex justify-between">
                        <span>Databases Found</span>
                        <span>{scanData.databases.length}</span>
                    </div>
                    <div className="divide-y max-h-40 overflow-y-auto">
                        {scanData.databases.map((db, i) => (
                            <div key={i} className="px-4 py-2 flex justify-between items-center text-sm">
                                <span className="font-mono text-gray-700">{db.name}</span>
                                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">{db.size_mb} MB</span>
                            </div>
                        ))}
                        {scanData.databases.length === 0 && <div className="p-4 text-center text-gray-400 text-sm">No databases found</div>}
                    </div>
                </div>

                {/* Nginx Sites */}
                <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-gray-50 px-4 py-2 border-b font-bold text-xs uppercase text-gray-500 flex justify-between">
                        <span>Web Sites (Nginx)</span>
                        <span>{scanData.nginx.length}</span>
                    </div>
                    <div className="divide-y max-h-40 overflow-y-auto">
                        {scanData.web_roots.map((site, i) => (
                            <div key={i} className="px-4 py-2 flex justify-between items-center text-sm">
                                <div className="flex flex-col">
                                    <span className="font-bold text-gray-800">{site.site}</span>
                                    <span className="text-xs text-gray-400 font-mono">{site.root}</span>
                                </div>
                                <FaServer className="text-gray-300" />
                            </div>
                        ))}
                        {scanData.nginx.length === 0 && <div className="p-4 text-center text-gray-400 text-sm">No Nginx sites found</div>}
                    </div>
                </div>

                <div className="flex justify-between pt-4">
                    <button onClick={() => setStep(STEP_CONNECT)} className="text-gray-500 underline text-sm">Re-Connect</button>
                    <button
                        onClick={() => setStep(STEP_SELECT)}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2"
                    >
                        Next: Select Assets <FaArrowRight />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <FaServer className="text-blue-600" /> Server Migration Manager
                    </h1>
                    <p className="text-gray-500 mt-2">Migrate code, database, and assets from Source VPS to this server.</p>
                </div>
                <div className="flex items-center gap-2">
                    <StepIndicator current={step} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">

                    {/* STEP 1: CONNECT */}
                    {step === STEP_CONNECT && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <FaNetworkWired /> Source Connection
                            </h2>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Source IP Address</label>
                                        <input
                                            type="text"
                                            value={connection.ip}
                                            onChange={(e) => setConnection({ ...connection, ip: e.target.value })}
                                            placeholder="e.g. 192.168.1.50"
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">SSH User</label>
                                        <input
                                            type="text"
                                            value={connection.user}
                                            onChange={(e) => setConnection({ ...connection, user: e.target.value })}
                                            placeholder="root"
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                        />
                                    </div>
                                </div>

                                {/* SSH Key Section */}
                                <div className="border-t pt-4">
                                    <h3 className="text-sm font-semibold mb-2">Authentication Setup</h3>
                                    {!sshKeys ? (
                                        <button
                                            onClick={handleGenerateKeys}
                                            disabled={loading}
                                            className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50"
                                        >
                                            {loading ? 'Generating...' : '1. Generate Migration Keys'}
                                        </button>
                                    ) : (
                                        <div className="bg-gray-50 p-4 rounded border">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-green-600 font-bold text-sm flex items-center gap-1">
                                                    <FaCheck /> Keys Generated
                                                </span>
                                                <button
                                                    onClick={() => { navigator.clipboard.writeText(sshKeys.public_key); toast.success("Copied!"); }}
                                                    className="text-blue-600 text-xs hover:underline"
                                                >
                                                    Copy Public Key
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-600 mb-2">
                                                Run this on the <strong>SOURCE</strong> server to allow access:
                                            </p>
                                            <code className="block bg-black text-green-400 p-2 rounded text-xs overflow-x-auto">
                                                echo "{sshKeys.public_key.trim()}" &gt;&gt; ~/.ssh/authorized_keys
                                            </code>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button
                                        onClick={handleTestConnection}
                                        disabled={!sshKeys || loading || !connection.ip}
                                        className={`px-6 py-2 rounded font-bold text-white transition-colors ${(!sshKeys || !connection.ip) ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                                            }`}
                                    >
                                        {loading ? 'Testing...' : '2. Test & Continue'} <FaArrowRight className="inline ml-2" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Placeholder for future steps */}
                    {/* STEP 2: SCAN */}
                    {step === STEP_SCAN && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <FaFolderOpen className="text-yellow-500" /> Source Analysis
                            </h2>
                            {loading && !scanData ? (
                                <div className="text-center py-20">
                                    <div className="animate-spin text-4xl text-blue-600 mx-auto mb-4"><FaNetworkWired /></div>
                                    <p className="text-gray-500">Scanning remote system...</p>
                                </div>
                            ) : renderScanResults()}
                        </div>
                    )}

                </div>

                {/* Console / Logs Sidebar */}
                <div className="bg-gray-900 rounded-xl p-4 text-xs font-mono text-gray-300 h-[600px] overflow-y-auto flex flex-col">
                    <h3 className="text-gray-500 font-bold mb-2 uppercase border-b border-gray-700 pb-2">Migration Console</h3>
                    <div className="flex-1 space-y-1">
                        {logs.length === 0 && <span className="text-gray-600 italic">Ready to initialize...</span>}
                        {logs.map((log, i) => (
                            <div key={i} className={`flex gap-2 ${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : log.type === 'warning' ? 'text-yellow-400' : 'text-blue-300'}`}>
                                <span className="text-gray-600">[{log.time}]</span>
                                <span>{log.msg}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StepIndicator({ current }) {
    const steps = [STEP_CONNECT, STEP_SCAN, STEP_SELECT, STEP_MIGRATE];
    return (
        <div className="flex gap-1">
            {steps.map((s, i) => (
                <div key={s} className={`h-2 w-8 rounded-full ${current === s ? 'bg-blue-600' : steps.indexOf(current) > i ? 'bg-green-500' : 'bg-gray-200'}`} />
            ))}
        </div>
    );
}
