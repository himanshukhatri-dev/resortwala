import React, { useEffect } from 'react';
import { useLearning } from '../context/LearningContext';

const VideoList = ({ videos: propVideos, onVideoSelect }) => {
    const { videos: contextVideos, loading, refresh } = useLearning();
    const videos = propVideos || contextVideos;

    useEffect(() => {
        refresh();
    }, []);

    if (loading) {
        return <div className="p-4 text-center">Loading learning videos...</div>;
    }

    if (!videos || videos.length === 0) {
        return <div className="p-4 text-center text-gray-500">No videos available at the moment.</div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
                <div
                    key={video.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group"
                    onClick={() => onVideoSelect && onVideoSelect(video)}
                >
                    <div className="aspect-video bg-gray-100 relative cursor-pointer">
                        {video.thumbnail_url ? (
                            <img
                                src={video.thumbnail_url}
                                alt={video.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex'; // Show fallback
                                }}
                            />
                        ) : null}
                        <div className={`w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 absolute top-0 left-0 ${video.thumbnail_url ? 'hidden' : 'flex'}`}>
                            <span className="text-4xl">▶️</span>
                        </div>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button className="bg-white text-blue-600 rounded-full w-12 h-12 flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                                <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                </svg>
                            </button>
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            {formatDuration(video.duration_seconds)}
                        </div>
                    </div>
                    {/* ... details ... */}
                    <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="bg-blue-50 text-blue-600 text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                {video.category?.replace('_', ' ')}
                            </span>
                            {/* Progress Check */}
                            {video.progress?.some(p => p.status === 'completed') && (
                                <span className="text-green-500 text-xs font-medium flex items-center gap-1">
                                    ✓ Completed
                                </span>
                            )}
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2" title={video.title}>{video.title}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-3">{video.description}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

const formatDuration = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
};

export default VideoList;
