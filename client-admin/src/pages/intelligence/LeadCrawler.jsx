import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FaChartLine, FaDatabase, FaBolt, FaSearch, FaFilter, FaFileDownload } from 'react-icons/fa';

// Components
import ControlPanel from './components/ControlPanel';
import LeadsTable from './components/LeadsTable';
import CrawlHistory from './components/CrawlHistory';
import { API_BASE_URL } from '../../config';

// Determine API Base URL
// Removed local definition to use shared config

const LeadCrawler = () => {
    const [activeTab, setActiveTab] = useState('live'); // live, history, quality

    // State: Selection (Crawl Inputs)
    const [crawlCity, setCrawlCity] = useState('');
    const [category, setCategory] = useState('Resort');
    const [depth, setDepth] = useState(1);

    // State: Filters & Search
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCity, setFilterCity] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
    const [minScore, setMinScore] = useState('');

    // State: Data
    const [leads, setLeads] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(false);

    // State: Status
    const [crawling, setCrawling] = useState(false);
    const [currentJob, setCurrentJob] = useState(null);

    const token = localStorage.getItem('admin_token');
    const pollInterval = useRef(null);
    const searchTimeout = useRef(null);

    // Initial Load
    useEffect(() => {
        fetchLeads();
        fetchJobs();
        return () => stopPolling();
    }, []);

    // Search Debounce
    useEffect(() => {
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            fetchLeads(1);
        }, 500);
    }, [searchQuery, filterCity, minScore]);

    // --- API CALLS ---

    const fetchLeads = async (page = 1) => {
        setLoading(true);
        try {
            const params = {
                page,
                sort_by: sortConfig.key,
                sort_order: sortConfig.direction,
                search: searchQuery,
                city: filterCity,
                min_score: minScore
            };

            const res = await axios.get(`${API_BASE_URL}/intelligence/leads`, {
                headers: { Authorization: `Bearer ${token}` },
                params
            });
            setLeads(res.data.data);
            setPagination({
                current_page: res.data.current_page,
                last_page: res.data.last_page,
                total: res.data.total,
                from: res.data.from,
                to: res.data.to,
                prev_page_url: res.data.prev_page_url,
                next_page_url: res.data.next_page_url
            });
        } catch (error) {
            toast.error("Failed to fetch leads");
        } finally {
            setLoading(false);
        }
    };

    const fetchJobs = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/intelligence/jobs`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setJobs(res.data);
            // Check if latest job is running
            if (res.data.length > 0) {
                const latest = res.data[0];
                if (latest.status === 'pending' || latest.status === 'running') {
                    setCurrentJob(latest);
                    setCrawling(true);
                    if (!pollInterval.current) startPolling();
                }
            }
        } catch (error) {
            console.error("Fetch jobs failed", error);
        }
    };

    const handleCrawl = async () => {
        if (!crawlCity) return toast.error("City is required");

        setCrawling(true);
        toast.loading("Initiating Neural Crawl...");

        try {
            const res = await axios.post(`${API_BASE_URL}/intelligence/trigger`, {
                city: crawlCity,
                category,
                depth
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.dismiss();
            toast.success("Agents deployed to " + crawlCity);

            setCurrentJob(res.data.job);
            startPolling();

        } catch (error) {
            toast.dismiss();
            toast.error("Launch Failed: " + (error.response?.data?.message || 'Unknown Error'));
            setCrawling(false);
        }
    };

    const handleUpdate = (updatedLead) => {
        setLeads(leads.map(l => l.id === updatedLead.id ? updatedLead : l));
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
        // Immediate fetch with new sort
        setTimeout(() => fetchLeads(1), 0);
    };

    const handleExport = async () => {
        try {
            toast.loading("Preparing Export...");
            const params = {
                sort_by: sortConfig.key,
                sort_order: sortConfig.direction,
                search: searchQuery,
                city: filterCity,
                min_score: minScore
            };

            const response = await axios.get(`${API_BASE_URL}/intelligence/leads/export`, {
                headers: { Authorization: `Bearer ${token}` },
                params,
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.dismiss();
            toast.success("Export Downloaded");
        } catch (error) {
            toast.dismiss();
            toast.error("Export Failed");
            console.error(error);
        }
    };

    // --- POLLING LOGIC ---

    const startPolling = () => {
        if (pollInterval.current) return;

        pollInterval.current = setInterval(async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/intelligence/jobs`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const latest = res.data[0];
                setJobs(res.data);

                if (latest && (latest.status === 'completed' || latest.status === 'failed')) {
                    stopPolling();
                    setCrawling(false);
                    setCurrentJob(latest);
                    fetchLeads(); // Refresh data table

                    if (latest.status === 'completed') {
                        toast.success(`Mission Complete: ${latest.leads_added} new leads acquired!`);
                    } else {
                        toast.error("Mission Failed: " + latest.error_message);
                    }
                } else if (latest) {
                    setCurrentJob(latest); // Update progress bar
                }
            } catch (err) {
                console.error("Polling error", err);
            }
        }, 3000);
    };

    const stopPolling = () => {
        if (pollInterval.current) {
            clearInterval(pollInterval.current);
            pollInterval.current = null;
        }
    };

    // --- RENDER ---

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                    <FaBolt className="text-blue-600" />
                    Market Intelligence Console
                </h1>
                <p className="text-gray-500 mt-2 text-lg">AI-Powered Lead Discovery & Market Analysis System</p>
            </div>

            {/* Control Panel (Crawler) */}
            <ControlPanel
                city={crawlCity} setCity={setCrawlCity}
                category={category} setCategory={setCategory}
                depth={depth} setDepth={setDepth}
                onCrawl={handleCrawl}
                crawling={crawling}
                currentJob={currentJob}
            />

            {/* Tabs */}
            <div className="flex gap-1 mb-6 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('live')}
                    className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 ${activeTab === 'live' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <div className="flex items-center gap-2"><FaDatabase /> Live Leads</div>
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 ${activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <div className="flex items-center gap-2"><FaChartLine /> Crawl Logs</div>
                </button>
            </div>

            {/* Content Area */}
            {activeTab === 'live' && (
                <div className="space-y-4">
                    {/* Filters Toolbar */}
                    <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex-1 relative">
                            <FaSearch className="absolute left-3 top-3 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search Strategy (Name, Phone, City, Notes)..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>
                        <div className="w-full md:w-48 relative">
                            <FaFilter className="absolute left-3 top-3 text-gray-400 text-xs" />
                            <input
                                type="text"
                                placeholder="Filter City..."
                                value={filterCity}
                                onChange={(e) => setFilterCity(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>
                        <div className="w-full md:w-32">
                            <input
                                type="number"
                                placeholder="Min Score"
                                value={minScore}
                                onChange={(e) => setMinScore(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>
                        <button
                            onClick={handleExport}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700 transition flex items-center gap-2 shadow-sm"
                        >
                            <FaFileDownload /> Export CSV
                        </button>
                    </div>

                    <LeadsTable
                        leads={leads}
                        loading={loading}
                        pagination={pagination}
                        onPageChange={fetchLeads}
                        onUpdate={handleUpdate}
                        onSort={handleSort}
                        sortConfig={sortConfig}
                    />
                </div>
            )}

            {activeTab === 'history' && (
                <CrawlHistory
                    jobs={jobs}
                    onRefresh={fetchJobs}
                />
            )}
        </div>
    );
};

export default LeadCrawler;
