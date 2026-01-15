import React, { useState } from 'react';
import { FaPhone, FaGlobe, FaMapMarkerAlt, FaStar, FaExternalLinkAlt, FaSort, FaSortUp, FaSortDown, FaUserTie, FaEdit, FaInfoCircle } from 'react-icons/fa';
import LeadDetailsModal from './LeadDetailsModal';

const LeadsTable = ({ leads, loading, pagination, onPageChange, onUpdate, onSort, sortConfig }) => {
    const [selectedLead, setSelectedLead] = useState(null);

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const getSourceIcon = (source) => {
        if (source === 'google') return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">GOOGLE</span>;
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-50 text-gray-600 border border-gray-100">MANUAL</span>;
    };

    const getStatusBadge = (status) => {
        const styles = {
            new: 'bg-blue-50 text-blue-700 border-blue-100',
            contacted: 'bg-yellow-50 text-yellow-700 border-yellow-100',
            interested: 'bg-purple-50 text-purple-700 border-purple-100',
            converted: 'bg-green-50 text-green-700 border-green-100',
            rejected: 'bg-red-50 text-red-700 border-red-100',
        };
        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles.new} uppercase tracking-wide`}>
                {status}
            </span>
        );
    };

    const SortIcon = ({ column }) => {
        if (sortConfig.key !== column) return <FaSort className="text-gray-300" />;
        return sortConfig.direction === 'asc' ? <FaSortUp className="text-blue-600" /> : <FaSortDown className="text-blue-600" />;
    };

    const SortHeader = ({ label, column, className = "" }) => (
        <th
            className={`px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors select-none text-xs font-bold text-gray-600 uppercase tracking-wider ${className}`}
            onClick={() => onSort(column)}
        >
            <div className="flex items-center gap-1">
                {label}
                <SortIcon column={column} />
            </div>
        </th>
    );

    const Pagination = () => {
        if (!pagination) return null;
        return (
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                    Showing <strong>{pagination.from}-{pagination.to}</strong> of <strong>{pagination.total}</strong> leads
                </span>
                <div className="flex gap-2">
                    <button
                        disabled={!pagination.prev_page_url}
                        onClick={() => onPageChange(pagination.current_page - 1)}
                        className="px-3 py-1 text-xs font-medium bg-white border border-gray-200 rounded-md shadow-sm disabled:opacity-50 hover:bg-gray-50"
                    >
                        Previous
                    </button>
                    <button
                        disabled={!pagination.next_page_url}
                        onClick={() => onPageChange(pagination.current_page + 1)}
                        className="px-3 py-1 text-xs font-medium bg-white border border-gray-200 rounded-md shadow-sm disabled:opacity-50 hover:bg-gray-50"
                    >
                        Next
                    </button>
                </div>
            </div>
        );
    };

    return (
        <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <SortHeader label="Business" column="name" className="w-[250px]" />
                                <SortHeader label="Contact" column="phone" />
                                <SortHeader label="Person" column="contact_person" />
                                <SortHeader label="Score" column="confidence_score" />
                                <SortHeader label="Status" column="status" />
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {leads.map((lead) => (
                                <tr key={lead.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col max-w-[250px]">
                                            <span className="font-bold text-gray-900 text-sm truncate" title={lead.name}>{lead.name}</span>
                                            <div className="flex items-center gap-1 text-[10px] text-gray-500 truncate">
                                                <FaMapMarkerAlt className="text-gray-300" />
                                                <span className="truncate">{lead.city} • {lead.category || 'Prop'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col gap-0.5">
                                            {lead.phone ? (
                                                <div className="flex items-center gap-1.5 text-xs text-gray-700 font-mono">
                                                    <FaPhone className="text-green-500 text-[10px]" />
                                                    {lead.phone}
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-gray-300 italic">No Phone</span>
                                            )}
                                            {lead.website && (
                                                <a href={lead.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-blue-600 hover:underline">
                                                    <FaGlobe /> Website <FaExternalLinkAlt className="text-[8px]" />
                                                </a>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {lead.contact_person ? (
                                            <div className="flex items-center gap-1.5 text-xs text-gray-800 font-medium">
                                                <FaUserTie className="text-gray-400" />
                                                {lead.contact_person}
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-gray-300 italic">--</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col gap-1 w-[80px]">
                                            <div className="flex items-center gap-1 group/tooltip relative">
                                                <div className="w-full bg-gray-200 rounded-full h-1 max-w-[50px]">
                                                    <div
                                                        className={`h-1 rounded-full ${lead.confidence_score > 70 ? 'bg-green-500' : lead.confidence_score > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                        style={{ width: `${lead.confidence_score}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-700">{Math.round(lead.confidence_score)}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-[9px] text-gray-400">
                                                <FaStar className="text-yellow-400" /> {lead.rating} ({lead.review_count})
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col items-start gap-1">
                                            {getStatusBadge(lead.status)}
                                            {lead.notes && (
                                                <span className="text-[9px] text-gray-400 italic max-w-[100px] truncate" title={lead.notes}>
                                                    {lead.notes}
                                                </span>
                                            )}
                                            <span className="text-[9px] text-gray-300">
                                                {new Date(lead.updated_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => setSelectedLead(lead)}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded hover:bg-gray-50 hover:text-blue-600 transition-colors shadow-sm"
                                        >
                                            <FaEdit /> Manage
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Desktop Pagination */}
                <Pagination />
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {leads.map((lead) => (
                    <div key={lead.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-gray-900 text-sm">{lead.name}</h3>
                                <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-1">
                                    <FaMapMarkerAlt className="text-gray-300" />
                                    <span>{lead.city} • {lead.category || 'Prop'}</span>
                                </div>
                            </div>
                            {getStatusBadge(lead.status)}
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-50">
                            <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Contact</span>
                                <div className="mt-1">
                                    {lead.phone ? (
                                        <a
                                            href={`tel:${lead.phone}`}
                                            className="inline-flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700 font-bold text-xs hover:bg-green-100 active:scale-95 transition-all shadow-sm"
                                        >
                                            <FaPhone className="text-green-600" />
                                            Call Now
                                        </a>
                                    ) : (
                                        <span className="text-gray-300 italic text-xs">No Phone</span>
                                    )}
                                </div>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Score</span>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${lead.confidence_score > 70 ? 'bg-green-500' : lead.confidence_score > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                            style={{ width: `${lead.confidence_score}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-bold text-gray-700">{Math.round(lead.confidence_score)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-2">
                            <span className="text-[10px] text-gray-300">
                                Updated: {new Date(lead.updated_at).toLocaleDateString()}
                            </span>
                            <button
                                onClick={() => setSelectedLead(lead)}
                                className="flex-1 ml-4 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                            >
                                View Details
                            </button>
                        </div>
                    </div>
                ))}

                {/* Mobile Pagination */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <Pagination />
                </div>
            </div>

            {selectedLead && (
                <LeadDetailsModal
                    lead={selectedLead}
                    onClose={() => setSelectedLead(null)}
                    onUpdate={(updatedLead) => {
                        onUpdate(updatedLead);
                        setSelectedLead(null);
                    }}
                />
            )}
        </>
    );
};

export default LeadsTable;
