import React from 'react';
import { FaPlay, FaCheckCircle, FaClock, FaFire, FaStar } from 'react-icons/fa';

const VideoCard = ({ video, onSelect }) => {
    const formatDuration = (seconds) => {
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    };

    const isCompleted = video.progress?.some(p => p.status === 'completed');
    const completionPercentage = video.progress?.[0]?.completion_percentage || 0;
    const isNew = new Date(video.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days old
    const isFeatured = video.is_featured;

    return (
        <div
            className={`group relative bg-white rounded-3xl overflow-hidden cursor-pointer transition-all duration-500 hover:-translate-y-2 ${isFeatured ? 'ring-2 ring-blue-500/20 shadow-blue-500/10' : 'border border-gray-100'
                } hover:shadow-2xl hover:shadow-gray-900/10`}
            onClick={() => onSelect(video)}
        >
            {/* Thumbnail Container */}
            <div className="aspect-[16/9] bg-gray-900 relative overflow-hidden isolate">
                {video.thumbnail_url ? (
                    <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900">
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
                    </div>
                )}

                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300" />

                {/* Glassmorphism Play Button */}
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 transition-all duration-300 group-hover:scale-110 group-hover:bg-white/20 shadow-2xl">
                        <FaPlay className="text-white text-xl ml-1 drop-shadow-lg" />
                    </div>
                </div>

                {/* Badges - Top Left */}
                <div className="absolute top-4 left-4 flex gap-2 z-10">
                    {isFeatured && (
                        <span className="px-2.5 py-1 bg-amber-400 text-amber-950 text-[10px] font-black uppercase tracking-wider rounded-lg shadow-lg flex items-center gap-1">
                            <FaStar size={10} />
                            Featured
                        </span>
                    )}
                    {isNew && (
                        <span className="px-2.5 py-1 bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow-lg flex items-center gap-1">
                            <FaFire size={10} />
                            New
                        </span>
                    )}
                </div>

                {/* Duration - Bottom Right */}
                <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg">
                    <FaClock className="text-gray-300" size={10} />
                    {formatDuration(video.duration_seconds)}
                </div>

                {/* Progress Bar - Bottom */}
                {!isCompleted && completionPercentage > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                        <div
                            className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] relative overflow-hidden"
                            style={{ width: `${completionPercentage}%` }}
                        >
                            <div className="absolute inset-0 bg-white/30 w-full animate-[shimmer_2s_infinite]" />
                        </div>
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="p-6 relative">
                {/* Completion Checkmark Absolute */}
                {isCompleted && (
                    <div className="absolute top-0 right-6 -translate-y-1/2 bg-emerald-500 text-white p-2 rounded-full border-4 border-white shadow-lg">
                        <FaCheckCircle size={14} />
                    </div>
                )}

                <div className="flex items-center gap-3 mb-3">
                    <span className="text-[10px] font-heavy font-bold text-blue-600 uppercase tracking-widest">
                        {video.category?.replace('_', ' ')}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${video.difficulty_level === 'beginner' ? 'text-emerald-600' :
                        video.difficulty_level === 'intermediate' ? 'text-amber-600' : 'text-rose-600'
                        }`}>
                        {video.difficulty_level}
                    </span>
                </div>

                <h3 className="text-base font-bold text-gray-900 leading-snug mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {video.title}
                </h3>

                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-6">
                    {video.description}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-dashed border-gray-100">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Status</span>
                        <span className={`text-xs font-bold ${isCompleted ? 'text-emerald-600' : completionPercentage > 0 ? 'text-blue-600' : 'text-gray-600'}`}>
                            {isCompleted ? 'Completed' : completionPercentage > 0 ? `${Math.round(completionPercentage)}% Complete` : 'Start Learning'}
                        </span>
                    </div>

                    <button className="px-4 py-2 bg-gray-50 text-gray-900 text-xs font-bold rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm hover:shadow-blue-500/25 flex items-center gap-2">
                        Watch
                        <FaPlay size={8} className="opacity-50 group-hover:opacity-100" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VideoCard;
