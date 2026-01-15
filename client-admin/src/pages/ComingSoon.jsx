import React from 'react';
import { FiClock, FiSettings } from 'react-icons/fi';

export default function ComingSoon({ title }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-indigo-50 flex items-center justify-center text-3xl text-indigo-600 animate-pulse">
                <FiClock />
            </div>
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">{title || 'Module Coming Soon'}</h1>
                <p className="text-slate-500 font-medium mt-2">This feature is scheduled for Phase 6+ (Enterprise Ops & Finance).</p>
            </div>
            <div className="flex gap-4">
                <div className="px-4 py-2 bg-white border border-slate-100 rounded-xl shadow-sm flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400 rotate-45"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">In Development</span>
                </div>
            </div>
        </div>
    );
}
