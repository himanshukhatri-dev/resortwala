
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { FaPaperPlane, FaUserClock, FaCheckCircle, FaWhatsapp, FaEnvelope } from 'react-icons/fa';

export default function AccountPending() {
    const { user, logout } = useAuth();

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] bg-white rounded-3xl p-8 md:p-16 shadow-lg border border-gray-100 text-center animate-fade-in-up">

            <div className="mb-8 relative">
                <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <FaUserClock className="text-4xl text-amber-500" />
                </div>
                {/* Decorative dots */}
                <div className="absolute top-0 right-0 w-4 h-4 bg-purple-400 rounded-full animate-bounce delay-100"></div>
                <div className="absolute bottom-0 left-0 w-3 h-3 bg-blue-400 rounded-full animate-bounce delay-300"></div>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
                Hold Tight, {user?.name?.split(' ')[0] || 'Partner'}! 🚀
            </h1>

            <p className="text-lg text-gray-500 max-w-xl mx-auto mb-12">
                Your account is currently <span className="font-bold text-amber-600">Under Review</span>.
                Our team is verifying your details to ensure the highest quality for our travelers.
            </p>

            {/* Interactive Tracker */}
            <div className="w-full max-w-2xl mx-auto mb-12">
                <div className="relative flex items-center justify-between">
                    {/* Line */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 z-0 rounded-full"></div>
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1/2 h-1 bg-green-500 z-0 rounded-full transition-all duration-1000"></div>

                    {/* Step 1 */}
                    <div className="relative z-10 flex flex-col items-center gap-2">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-200">
                            <FaPaperPlane size={14} />
                        </div>
                        <span className="text-xs font-bold text-green-600 uppercase tracking-wider">Registered</span>
                    </div>

                    {/* Step 2 */}
                    <div className="relative z-10 flex flex-col items-center gap-2">
                        <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-amber-200 scale-110 ring-4 ring-amber-50">
                            <FaUserClock size={20} className="animate-spin-slow" />
                        </div>
                        <span className="text-xs font-bold text-amber-600 uppercase tracking-wider bg-white px-2 py-1 rounded-full shadow-sm">Reviewing</span>
                    </div>

                    {/* Step 3 */}
                    <div className="relative z-10 flex flex-col items-center gap-2 opacity-50">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-400">
                            <FaCheckCircle size={14} />
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Approved</span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="bg-gray-50 rounded-2xl p-6 md:p-8 w-full max-w-2xl border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4">Want to speed things up?</h3>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => window.location.href = 'mailto:support@resortwala.com'}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 font-bold hover:bg-gray-50 hover:border-gray-300 transition shadow-sm group">
                        <FaEnvelope className="text-gray-400 group-hover:text-blue-500 transition" />
                        Email Support
                    </button>
                    <button
                        onClick={() => window.open('https://wa.me/919136276555?text=Hi%20ResortWala%20Support,%20my%20vendor%20account%20is%20pending%20approval.', '_blank')}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-[#25D366] text-white rounded-xl font-bold hover:bg-[#20bd5a] transition shadow-lg shadow-green-200 group">
                        <FaWhatsapp className="text-white text-lg group-hover:scale-110 transition" />
                        Chat on WhatsApp
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
                    >
                        Check Status Again
                    </button>
                </div>
            </div>

            <button onClick={logout} className="mt-8 text-gray-400 text-sm hover:text-gray-600 underline">
                Logout & Come Back Later
            </button>

            <style jsx>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 8s linear infinite;
                }
            `}</style>
        </div>
    );
}
