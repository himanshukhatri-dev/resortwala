import React from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';

const AuthCard = ({ children, title, subtitle, showBack = true, backLink = '/', logo = '/resortwala-logo.png' }) => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFC] p-4 font-outfit">
            {/* Background Decorative Elements */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-100/50 rounded-full blur-[100px]" />
            </div>

            <div className="w-full max-w-[440px] relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {showBack && (
                    <button
                        onClick={() => navigate(backLink)}
                        className="mb-6 flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors group font-bold text-sm"
                    >
                        <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center group-hover:bg-gray-50 group-hover:-translate-x-1 transition-all">
                            <FaArrowLeft size={12} />
                        </div>
                        Back to Home
                    </button>
                )}

                <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100/50 backdrop-blur-sm">
                    {/* Header */}
                    <div className="text-center mb-10">
                        {logo && (
                            <div className="inline-block p-4 bg-gray-50 rounded-3xl mb-6 shadow-inner">
                                <img src={logo} alt="ResortWala" className="h-10 w-auto" />
                            </div>
                        )}
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="text-gray-500 font-medium">
                                {subtitle}
                            </p>
                        )}
                    </div>

                    {/* Content */}
                    <div className="space-y-6">
                        {children}
                    </div>
                </div>

                {/* Footer Info */}
                <p className="mt-8 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">
                    Secure and Encrypted • ResortWala v2.0
                </p>
            </div>
        </div>
    );
};

export default AuthCard;
