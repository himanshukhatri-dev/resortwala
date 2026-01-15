import React from 'react';
import { FiSearch, FiFilter } from 'react-icons/fi';
import Pagination from './Pagination';

export default function AdminTable({
    title,
    subtitle,
    children,
    pagination,
    actions,
    searchPlaceholder = "Search...",
    searchTerm,
    onSearchChange,
    loading = false,
    emptyMessage = "No records found",
    mobileRenderer,
    filterContent
}) {
    return (
        <div className="space-y-6">
            {/* Header / Actions Row */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">{title}</h1>
                    {subtitle && <p className="text-gray-500 font-bold text-sm mt-1">{subtitle}</p>}
                </div>
                {actions && <div className="flex gap-2">{actions}</div>}
            </div>

            {/* Search Bar */}
            <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center gap-2 pr-2">
                <div className="flex-1 flex items-center px-4 gap-3 w-full">
                    <FiSearch className="text-gray-400 text-xl" />
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={searchTerm}
                        onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                        className="w-full py-3 bg-transparent border-none outline-none font-bold text-gray-700 placeholder-gray-300"
                    />
                </div>
                {filterContent && (
                    <div className="p-1">
                        {filterContent}
                    </div>
                )}
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-20 flex justify-center">
                        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Desktop View */}
                        <div className={`${mobileRenderer ? 'hidden md:block' : ''} overflow-x-auto`}>
                            <table className="w-full text-left">
                                {children}
                            </table>
                        </div>

                        {/* Mobile View */}
                        {mobileRenderer && (
                            <div className="md:hidden divide-y divide-gray-50 bg-gray-50">
                                {mobileRenderer()}
                            </div>
                        )}

                        {!loading && (!children || React.Children.count(children) === 0 || (React.isValidElement(children) && children.props.children?.length === 0)) && (
                            <div className="p-20 text-center text-gray-300 font-black uppercase tracking-widest text-xs">
                                {emptyMessage}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Pagination Controls */}
            {pagination && <Pagination {...pagination} />}
        </div>
    );
}
