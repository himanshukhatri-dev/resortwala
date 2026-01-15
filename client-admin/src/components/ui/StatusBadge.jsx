import React from 'react';

const styles = {
    // General Statuses
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    neutral: 'bg-gray-50 text-gray-600 border-gray-200',

    // Specific Business Logic Mappings
    confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',

    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    draft: 'bg-amber-50 text-amber-700 border-amber-200',

    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
    cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
    blocked: 'bg-gray-100 text-gray-500 border-gray-200',

    // User Roles
    admin: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    vendor: 'bg-orange-50 text-orange-700 border-orange-200',
    customer: 'bg-teal-50 text-teal-700 border-teal-200',
};

export default function StatusBadge({ status, type = 'neutral', className = '' }) {
    const statusKey = status?.toLowerCase() || 'neutral';

    // Try to find exact match in styles, otherwise fall back to 'type' prop or 'neutral'
    const colorClass = styles[statusKey] || styles[type] || styles.neutral;

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${colorClass} ${className}`}>
            {status}
        </span>
    );
}
