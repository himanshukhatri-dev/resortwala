import React from 'react';
import { FaClock, FaCheck, FaExclamationTriangle, FaDownload, FaSyncAlt } from 'react-icons/fa';

const CrawlHistory = ({ jobs, onRefresh }) => {

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('en-IN', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });
    };

    const getDuration = (start, end) => {
        if (!start || !end) return '-';
        const s = new Date(start);
        const e = new Date(end);
        const diff = (e - s) / 1000;
        return `${Math.round(diff)}s`;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    <FaClock className="text-gray-400" />
                    Recent Crawl Runs
                </h3>
                <button onClick={onRefresh} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                    <FaSyncAlt />
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-xs uppercase tracking-wider text-gray-500 font-semibold border-b border-gray-100">
                            <th className="px-6 py-3">Run ID</th>
                            <th className="px-6 py-3">Target</th>
                            <th className="px-6 py-3">Results</th>
                            <th className="px-6 py-3">Quality Stats</th>
                            <th className="px-6 py-3">Timing</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm">
                        {jobs.map((job) => (
                            <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-3 font-mono text-xs text-gray-500">
                                    #{job.id}
                                </td>
                                <td className="px-6 py-3">
                                    <div className="font-medium text-gray-900">{job.city}</div>
                                    <div className="text-xs text-gray-500 bg-gray-100 inline-block px-1.5 rounded mt-0.5">
                                        {job.category || 'Mixed'}
                                    </div>
                                </td>
                                <td className="px-6 py-3">
                                    {job.status === 'completed' ? (
                                        <div className="flex flex-col">
                                            <span className="text-green-600 font-bold flex items-center gap-1">
                                                <FaCheck className="text-[10px]" />
                                                {job.leads_added || 0} New
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                Found {job.leads_found} total
                                            </span>
                                        </div>
                                    ) : (
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${job.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {job.status.toUpperCase()}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-3 text-xs">
                                    <div className="flex items-center gap-3">
                                        <span className="text-orange-500 flex items-center gap-1" title="Duplicates Skipped">
                                            Dupes: <strong>{job.duplicate_leads_count || 0}</strong>
                                        </span>
                                        {job.error_count > 0 && (
                                            <span className="text-red-500 flex items-center gap-1" title="API Errors">
                                                <FaExclamationTriangle /> <strong>{job.error_count}</strong>
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-3 text-xs text-gray-500">
                                    <div>{formatDate(job.created_at)}</div>
                                    <div className="text-gray-400">Duration: {getDuration(job.started_at, job.completed_at)}</div>
                                </td>
                                <td className="px-6 py-3 text-right">
                                    <button disabled className="text-gray-400 hover:text-blue-600 transition-colors cursor-not-allowed" title="Download CSV (Coming Soon)">
                                        <FaDownload />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CrawlHistory;
