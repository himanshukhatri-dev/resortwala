import React from 'react';
import { FaPlay, FaFilter, FaSearch, FaHistory, FaNetworkWired } from 'react-icons/fa';

const ControlPanel = ({
    city, setCity,
    category, setCategory,
    depth, setDepth,
    onCrawl,
    crawling,
    currentJob
}) => {
    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">

                {/* 1. City Input */}
                <div className="flex-1 w-full">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Target City</label>
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-3 text-gray-400" />
                        <input
                            type="text"
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                            placeholder="e.g. Lonavala, Goa..."
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            disabled={crawling}
                        />
                    </div>
                </div>

                {/* 2. Category Selector */}
                <div className="w-full md:w-64">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Business Category</label>
                    <div className="relative">
                        <FaFilter className="absolute left-3 top-3 text-gray-400" />
                        <select
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none cursor-pointer"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            disabled={crawling}
                        >
                            <option value="Resort">Resort</option>
                            <option value="Villa">Villa</option>
                            <option value="Hotel">Hotel</option>
                            <option value="Farm Stay">Farm Stay</option>
                            <option value="Homestay">Homestay</option>
                            <option value="Cottage">Cottage</option>
                            <option value="Water Park">Water Park</option>
                        </select>
                    </div>
                </div>

                {/* 3. Depth / Limit */}
                <div className="w-full md:w-48">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Crawl Depth</label>
                    <select
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                        value={depth}
                        onChange={(e) => setDepth(Number(e.target.value))}
                        disabled={crawling}
                    >
                        <option value={1}>Scout (20 leads)</option>
                        <option value={2}>Deep (40 leads)</option>
                        <option value={3}>Full (60 leads)</option>
                    </select>
                </div>

                {/* 4. Action Button */}
                <div className="w-full md:w-auto">
                    <button
                        onClick={onCrawl}
                        disabled={crawling || !city}
                        className={`
                            h-[42px] px-8 rounded-lg font-semibold text-white shadow-md flex items-center justify-center gap-2 transition-all w-full md:w-auto
                            ${crawling ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95'}
                        `}
                    >
                        {crawling ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                Running...
                            </>
                        ) : (
                            <>
                                <FaPlay className="text-sm" />
                                Start Neural Crawl
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Real-time Status Bar */}
            {currentJob && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${currentJob.status === 'running' || currentJob.status === 'pending' ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`}></span>
                            <span className="font-medium">Job #{currentJob.id}: {currentJob.status.toUpperCase()}</span>
                        </div>
                        <div className="flex gap-4">
                            <span>Found: <strong>{currentJob.leads_found || 0}</strong></span>
                            <span className="text-green-600">New: <strong>{currentJob.new_leads_count || currentJob.leads_added || 0}</strong></span>
                            <span className="text-orange-500">Dupes: <strong>{currentJob.duplicate_leads_count || 0}</strong></span>
                        </div>
                    </div>
                    {(currentJob.status === 'running' || currentJob.status === 'pending') && (
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 animate-loading-bar rounded-full"></div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ControlPanel;
