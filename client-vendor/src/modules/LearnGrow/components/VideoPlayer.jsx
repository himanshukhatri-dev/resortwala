import React, { useRef, useEffect, useState } from 'react';

const VideoPlayer = ({ url, onProgress, onComplete, initialProgress = 0 }) => {
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(initialProgress);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleTimeUpdate = () => {
            const current = video.currentTime;
            const total = video.duration;

            if (total > 0) {
                const percent = (current / total) * 100;
                setProgress(percent);

                // Report progress every 5 seconds or 5%
                if (onProgress) {
                    onProgress({
                        watch_duration_seconds: Math.floor(current),
                        completion_percentage: Math.floor(percent),
                        status: percent > 95 ? 'completed' : 'in_progress'
                    });
                }
            }
        };

        const handleEnded = () => {
            setIsPlaying(false);
            if (onComplete) onComplete();
        };

        const handleLoadedMetadata = () => {
            setDuration(video.duration);
            if (initialProgress > 0 && video.duration) {
                video.currentTime = (initialProgress / 100) * video.duration;
            }
        };

        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('ended', handleEnded);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('ended', handleEnded);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
    }, [onProgress, onComplete, initialProgress]);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    return (
        <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-lg group">
            <video
                ref={videoRef}
                src={url}
                className="w-full h-full object-contain"
                controls={false}
                onClick={togglePlay}
            />

            {/* Custom Overlay Controls (Simplified) */}
            <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
                <button
                    onClick={togglePlay}
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-4 rounded-full text-white transition-all transform hover:scale-110"
                >
                    {isPlaying ? (
                        <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg>
                    ) : (
                        <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    )}
                </button>
            </div>

            {/* Simple Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
                <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
};

export default VideoPlayer;
