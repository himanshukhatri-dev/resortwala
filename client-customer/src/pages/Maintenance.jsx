import React from 'react';
import { Helmet } from 'react-helmet-async';
import { FaTools, FaWhatsapp, FaEnvelope } from 'react-icons/fa';

const Maintenance = ({ content, logo }) => {
    const data = content || {
        title: "We’re upgrading your experience 🚀",
        subtitle: "Resortwala is undergoing scheduled maintenance.",
        description: "We are rolling out new features to serve you better. We'll be back shortly!",
        estimated_return: "2 hours",
        contact_email: "support@resortwala.com"
    };

    return (
        <>
            <Helmet>
                <title>Maintenance - ResortWala</title>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>

            <div className="h-[100dvh] w-screen flex flex-col items-center justify-center relative overflow-hidden bg-slate-50">
                {/* Background Blobs */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none text-slate-200/50">
                    {data.background_url ? (
                        <div
                            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 blur-[2px]"
                            style={{ backgroundImage: `url(${data.background_url})` }}
                        />
                    ) : (
                        <>
                            <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] bg-blue-100 rounded-full blur-[120px] animate-pulse"></div>
                            <div className="absolute top-[40%] -left-[10%] w-[40%] h-[40%] bg-orange-100 rounded-full blur-[100px] animate-pulse delay-1000"></div>
                        </>
                    )}
                </div>

                <div className="relative z-10 p-8 md:p-12 bg-white/80 backdrop-blur-xl border border-white rounded-3xl shadow-2xl max-w-xl w-[90%] text-center">
                    <div className="mb-8 flex justify-center flex-col items-center gap-4">
                        {logo && <img src={logo} alt="ResortWala" className="h-12 w-auto mb-2" />}
                        <div className="w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6">
                            <FaTools className="text-white text-3xl animate-bounce" />
                        </div>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-black text-slate-800 mb-4 leading-tight">
                        {data.title}
                    </h1>

                    <p className="text-slate-600 font-bold mb-2">{data.subtitle}</p>
                    <p className="text-slate-500 text-sm md:text-base mb-8 leading-relaxed">
                        {data.description}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Expected Return</p>
                            <p className="text-slate-800 font-bold">{data.estimated_return}</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Status</p>
                            <div className="flex items-center justify-center gap-2">
                                <span className="w-2 h-2 bg-orange-500 rounded-full animate-ping"></span>
                                <span className="text-slate-800 font-bold uppercase text-xs tracking-wider">In Progress</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href="https://wa.me/919136276555"
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg shadow-slate-900/10"
                        >
                            <FaWhatsapp /> WhatsApp Support
                        </a>
                        <a
                            href={`mailto:${data.contact_email}`}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all"
                        >
                            <FaEnvelope /> Email Support
                        </a>
                    </div>
                </div>

                <div className="mt-8 text-slate-400 text-sm font-medium">
                    &copy; 2026 ResortWala.
                </div>
            </div>
        </>
    );
};

export default Maintenance;
