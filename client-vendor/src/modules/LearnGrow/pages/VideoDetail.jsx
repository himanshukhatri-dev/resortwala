import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { learningService } from '../services/learningService';
import VideoPlayer from '../components/VideoPlayer';
import { useLearning } from '../context/LearningContext';

const VideoDetail = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { updateVideoProgress } = useLearning();
    const [video, setVideo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVideo = async () => {
            try {
                const data = await learningService.getVideoBySlug(slug);
                setVideo(data);
            } catch (error) {
                console.error("Failed to load video", error);
                // navigate('/learning'); // Redirect on error
            } finally {
                setLoading(false);
            }
        };

        if (slug) {
            fetchVideo();
        }
    }, [slug]);

    const handleProgress = (progressData) => {
        if (video) {
            // In a real app, debounce this call to avoid flooding API
            // For now, relying on Service or Context to handle optimizing
            updateVideoProgress(video.id, progressData);
        }
    };

    const handleComplete = () => {
        console.log("Video Completed");
        if (video) {
            updateVideoProgress(video.id, { status: 'completed', completion_percentage: 100 });
        }
    };

    if (loading) return <div className="p-8 text-center">Loading video...</div>;
    if (!video) return <div className="p-8 text-center">Video not found.</div>;

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6">
            <button
                onClick={() => navigate('/learning')}
                className="mb-4 text-gray-500 hover:text-gray-900 flex items-center gap-1 text-sm font-medium"
            >
                ← Back to Hub
            </button>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <VideoPlayer
                    url={video.video_url}
                    initialProgress={video.progress?.[0]?.completion_percentage || 0}
                    onProgress={handleProgress}
                    onComplete={handleComplete}
                />

                <div className="p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{video.title}</h1>

                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-6 border-b border-gray-100 pb-6">
                        <span className="flex items-center gap-1">
                            🕒 {Math.floor(video.duration_seconds / 60)} min
                        </span>
                        <span className="px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                            {video.category}
                        </span>
                    </div>

                    <div className="prose max-w-none text-gray-600">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">About this lesson</h3>
                        <p>{video.description}</p>

                        {video.key_points && (
                            <div className="mt-6 bg-blue-50 p-4 rounded-xl">
                                <h4 className="font-medium text-blue-900 mb-2">Key Takeaways</h4>
                                <ul className="list-disc list-inside space-y-1 text-blue-800">
                                    {video.key_points.map((point, i) => (
                                        <li key={i}>{point}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoDetail;
