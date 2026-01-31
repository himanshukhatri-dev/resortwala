import React, { useState } from 'react';
import { LearningProvider, useLearning } from '../context/LearningContext';
import VideoList from '../components/VideoList';
import VideoPlayer from '../components/VideoPlayer';

const LearningHubContent = () => {
    const { videos, updateVideoProgress } = useLearning();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [selectedVideo, setSelectedVideo] = useState(null);

    const filteredVideos = videos?.filter(video => {
        const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            video.description.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory = activeCategory === 'All' ||
            (video.category && video.category.replace('_', ' ').toLowerCase().includes(activeCategory.toLowerCase().split(' ')[0]));

        return matchesSearch && matchesCategory;
    });

    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Learning Hub</h1>
                    <p className="text-gray-500 text-sm mt-1">Master the vendor panel and grow your business</p>
                </div>

                <div className="relative md:w-64">
                    <input
                        type="text"
                        placeholder="Search tutorials..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            <div className="hidden md:block bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2 gap-4">
                    <div>
                        <span className="text-sm font-medium opacity-90 block">Your Progress</span>
                        <div className="flex items-end gap-2">
                            <span className="text-2xl font-bold">15%</span>
                            <span className="text-sm opacity-80 mb-1">completed</span>
                        </div>
                    </div>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full h-fit">Level 1</span>
                </div>
                <div className="w-full bg-black/20 h-1.5 rounded-full mt-1 overflow-hidden">
                    <div className="bg-white h-full rounded-full w-[15%]"></div>
                </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {['All', 'Getting Started', 'Listing & Pricing', 'Availability & Bookings'].map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === cat
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <VideoList
                videos={filteredVideos}
                onVideoSelect={setSelectedVideo}
            />

            {selectedVideo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl w-full max-w-4xl overflow-hidden shadow-2xl animate-fade-in relative">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-bold text-gray-900">{selectedVideo.title}</h3>
                            <button
                                onClick={() => setSelectedVideo(null)}
                                className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-100 rounded-full"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="bg-black">
                            <VideoPlayer
                                url={selectedVideo.video_url}
                                initialProgress={0}
                                onProgress={(progress) => updateVideoProgress(selectedVideo.id, progress)}
                            />
                        </div>
                        <div className="p-4">
                            <p className="text-gray-600 text-sm">{selectedVideo.description}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const LearningHub = () => (
    <LearningProvider>
        <LearningHubContent />
    </LearningProvider>
);

export default LearningHub;
