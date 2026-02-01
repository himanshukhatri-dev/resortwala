import React, { useEffect } from 'react';
import { useLearning } from '../context/LearningContext';
import VideoCard from './VideoCard';

const VideoList = ({ videos: propVideos, onVideoSelect }) => {
    const { videos: contextVideos, loading, refresh } = useLearning();
    const videos = propVideos || contextVideos;

    useEffect(() => {
        if (!propVideos) {
            refresh();
        }
    }, [propVideos]);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-72 bg-gray-100 rounded-2xl" />
                ))}
            </div>
        );
    }

    if (!videos || videos.length === 0) {
        return (
            <div className="py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mx-auto mb-4 text-3xl">
                    🎬
                </div>
                <h3 className="text-gray-900 font-bold text-lg">No videos found</h3>
                <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
                    We couldn't find any tutorials matching your criteria. Try adjusting your search or filters.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {videos.map((video) => (
                <VideoCard
                    key={video.id}
                    video={video}
                    onSelect={onVideoSelect}
                />
            ))}
        </div>
    );
};

export default VideoList;
