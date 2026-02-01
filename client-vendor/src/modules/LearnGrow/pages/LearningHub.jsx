import React, { useState } from 'react';
import { useLearning } from '../context/LearningContext';
import VideoList from '../components/VideoList';
import VideoPlayer from '../components/VideoPlayer';
import { FaSearch, FaLightbulb, FaRocket, FaQuestionCircle, FaChartLine, FaPlay } from 'react-icons/fa';

const categories = [
    { id: 'All', name: 'All Tutorials', icon: FaLightbulb, color: 'text-amber-500 bg-amber-50' },
    { id: 'getting_started', name: 'Getting Started', icon: FaRocket, color: 'text-blue-500 bg-blue-50' },
    { id: 'listing_pricing', name: 'Listing & Pricing', icon: FaChartLine, color: 'text-purple-500 bg-purple-50' },
    { id: 'availability_bookings', name: 'Availability & Bookings', icon: FaQuestionCircle, color: 'text-emerald-500 bg-emerald-50' },
];

const LearningHub = () => {
    const { videos, updateVideoProgress, loading } = useLearning();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [selectedVideo, setSelectedVideo] = useState(null);

    const filteredVideos = videos?.filter(video => {
        const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            video.description.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory = activeCategory === 'All' || video.category === activeCategory;

        return matchesSearch && matchesCategory;
    });

    return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50/50">
            {/* Left Sidebar - Categories */}
            <aside className="w-full lg:w-80 bg-white border-r border-gray-100 p-8 flex flex-col gap-10">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <FaLightbulb size={18} />
                        </div>
                        <h1 className="text-xl font-black text-gray-900 tracking-tight">Learning Hub</h1>
                    </div>
                    <p className="text-gray-500 text-xs font-medium leading-relaxed ml-1">Master the ResortWala ecosystem with ease.</p>
                </div>

                <nav className="flex flex-col gap-1.5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-3">Browse Categories</p>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all group relative overflow-hidden ${activeCategory === cat.id
                                ? 'bg-blue-50 text-blue-700 shadow-md shadow-blue-500/5'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <div className={`p-2 rounded-xl transition-all duration-300 ${activeCategory === cat.id ? 'bg-white shadow-sm scale-110' : 'bg-gray-100 group-hover:bg-white group-hover:shadow-sm'}`}>
                                <cat.icon className={activeCategory === cat.id ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'} size={14} />
                            </div>
                            <span className="relative z-10">{cat.name}</span>
                            {activeCategory === cat.id && (
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-l-full" />
                            )}
                        </button>
                    ))}
                </nav>

                <div className="mt-auto">
                    <div className="relative overflow-hidden rounded-3xl bg-gray-900 p-6 text-white shadow-2xl">
                        <div className="relative z-10">
                            <h4 className="text-sm font-bold mb-1">Your Progress</h4>
                            <p className="text-[10px] text-gray-400 mb-4">You're doing great! Keep going.</p>

                            <div className="flex items-end justify-between mb-2">
                                <span className="text-3xl font-black tracking-tight">15%</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1">Completed</span>
                            </div>

                            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden backdrop-blur-sm">
                                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full w-[15%] shadow-[0_0_12px_rgba(59,130,246,0.6)] animate-pulse"></div>
                            </div>
                        </div>

                        {/* Decor */}
                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl" />
                        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl" />
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-4 md:p-8 lg:p-10">
                <div className="max-w-7xl mx-auto space-y-10">
                    {/* Continue Learning Section */}
                    {videos?.some(v => v.progress?.some(p => p.completion_percentage > 0 && p.status !== 'completed')) && (
                        <section className="relative">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full shadow-lg shadow-blue-500/20" />
                                <h3 className="text-xl font-bold text-gray-900 tracking-tight">Continue Learning</h3>
                                <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-blue-100">
                                    Resume where you left off
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {videos
                                    .filter(v => v.progress?.some(p => p.completion_percentage > 0 && p.status !== 'completed'))
                                    .slice(0, 3)
                                    .map(video => (
                                        <VideoCard
                                            key={video.id}
                                            video={video}
                                            onSelect={setSelectedVideo}
                                        />
                                    ))}
                            </div>
                        </section>
                    )}

                    {/* Header with Search */}
                    <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm shadow-gray-500/5">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {categories.find(c => c.id === activeCategory)?.name || 'All Tutorials'}
                            </h2>
                            <p className="text-gray-500 text-sm">
                                {filteredVideos?.length || 0} matching tutorials found
                            </p>
                        </div>

                        <div className="relative md:w-80 group">
                            <FaSearch className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-blue-500" />
                            <input
                                type="text"
                                placeholder="Search tutorials..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 text-sm"
                            />
                        </div>
                    </header>

                    {/* Video Grid */}
                    <VideoList
                        videos={filteredVideos}
                        onVideoSelect={setSelectedVideo}
                    />
                </div>
            </main>

            {/* Video Modal Overlay */}
            {selectedVideo && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 relative">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                    <FaPlay size={14} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 leading-tight">{selectedVideo.title}</h3>
                                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Now Playing</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedVideo(null)}
                                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-all"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Video Player Section */}
                        <div className="aspect-video bg-black shadow-inner">
                            <VideoPlayer
                                url={selectedVideo.video_url}
                                initialProgress={selectedVideo.progress?.[0]?.completion_percentage || 0}
                                onProgress={(progress) => updateVideoProgress(selectedVideo.id, progress)}
                            />
                        </div>

                        {/* Content Section */}
                        <div className="p-8 bg-gray-50/30">
                            <div className="flex flex-col md:flex-row gap-8">
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <span className="px-3 py-1 bg-white shadow-sm border border-gray-100 rounded-lg text-xs font-bold text-gray-600">
                                            {selectedVideo.category?.replace('_', ' ')}
                                        </span>
                                        <span className="text-xs text-gray-400">•</span>
                                        <span className="text-xs text-gray-400 font-medium">
                                            {Math.floor(selectedVideo.duration_seconds / 60)} minutes duration
                                        </span>
                                    </div>
                                    <p className="text-gray-600 text-sm leading-relaxed max-w-2xl">
                                        {selectedVideo.description}
                                    </p>
                                </div>
                                <div className="md:w-64 space-y-4">
                                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3">Tutorial Help</h4>
                                        <p className="text-[11px] text-gray-500 leading-relaxed mb-4">
                                            Follow this guide to master the feature. You can resume anytime from where you left.
                                        </p>
                                        <button className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-all">
                                            Download Transcript
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LearningHub;
