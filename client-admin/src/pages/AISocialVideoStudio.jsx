import React, { useState, useEffect } from 'react';
import { Reorder } from "framer-motion";
import {
    FaVideo, FaImage, FaMagic, FaMusic, FaCheck, FaPlay, FaDownload,
    FaShareAlt, FaSpinner, FaTimes, FaChild, FaHashtag, FaSync,
    FaLayerGroup, FaPalette, FaInstagram, FaCloudUploadAlt
} from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';

export default function AISocialVideoStudio() {
    console.log('🎬 AISocialVideoStudio component rendered');
    const { token } = useAuth();
    const { showSuccess, showError } = useModal();

    // Steps: 1=Select, 2=Curate, 3=Customize, 4=Processing/Result
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Data
    const [properties, setProperties] = useState([]);
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [mediaFiles, setMediaFiles] = useState([]);

    // Debug: Log mediaFiles whenever it changes
    useEffect(() => {
        console.log('📦 mediaFiles state updated:', mediaFiles);
        console.log('📦 Number of media items:', mediaFiles.length);
        mediaFiles.forEach((item, idx) => {
            console.log(`📦 Media[${idx}]:`, {
                id: item.id,
                url: item.url,
                type: item.type,
                selected: item.selected,
                urlType: typeof item.url,
                urlLength: item.url?.length
            });
        });
    }, [mediaFiles]);

    // Job State
    const [jobId, setJobId] = useState(null);
    const [jobStatus, setJobStatus] = useState(null);
    const [project, setProject] = useState(null); // Full project data
    const [jobs, setJobs] = useState([]); // History

    // Options
    const [selectedTemplate, setSelectedTemplate] = useState('luxury');
    const [mood, setMood] = useState('luxury');
    const [showOptions, setShowOptions] = useState(false);
    const [showSafeZones, setShowSafeZones] = useState(false);
    const [previewPlatform, setPreviewPlatform] = useState('none'); // none, instagram, tiktok, shorts

    // TTS State
    const [useVoiceover, setUseVoiceover] = useState(false);
    const [script, setScript] = useState('');
    const [voiceId, setVoiceId] = useState('atlas'); // Default to Atlas
    const [voices, setVoices] = useState([]);
    const [isGeneratingScript, setIsGeneratingScript] = useState(false);

    // Debug: Component mount
    useEffect(() => {
        console.log('🚀 AISocialVideoStudio component MOUNTED');
        return () => console.log('💀 AISocialVideoStudio component UNMOUNTED');
    }, []);

    // Fetch Properties and Jobs on Mount
    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/admin/properties`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProperties(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        const fetchVoices = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/admin/video-generator/voices`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setVoices(res.data);
            } catch (err) { console.error("Failed to load voices", err); }
        };
        fetchProperties();
        fetchJobs();
        fetchVoices();
    }, [token]);

    const fetchJobs = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/video-generator`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setJobs(res.data);
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure? This will delete the video files.")) return;
        try {
            await axios.delete(`${API_BASE_URL}/admin/voice-studio/video-jobs/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showSuccess('Project deleted');
            fetchJobs();
        } catch (err) { showError('Delete failed'); }
    };

    const handleRetry = async (id) => {
        try {
            await axios.post(`${API_BASE_URL}/admin/video-generator/jobs/${id}/retry`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showSuccess('Job queued for retry');
            fetchJobs();
        } catch (err) { showError('Retry failed'); }
    };

    const handleEdit = (job) => {
        // Reload state
        if (job.property) setSelectedProperty(job.property);
        if (job.options?.mood) setMood(job.options.mood);

        // Try to load images?
        // We might not have the full valid media object list, we'd need to re-fetch property images
        // and then select the ones that were in job.options.media_ids
        setStep(1);
        toast.success("Loaded settings from Job #" + job.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const SafeZoneOverlay = () => {
        if (!showSafeZones || previewPlatform === 'none') return null;

        return (
            <div className="absolute inset-0 pointer-events-none z-10 border-red-500/20">
                {/* Platform Specific UIs */}
                {previewPlatform === 'instagram' && (
                    <>
                        {/* Bottom Info Bar */}
                        <div className="absolute bottom-0 left-0 right-0 h-[25%] bg-gradient-to-t from-black/40 to-transparent" />
                        <div className="absolute bottom-6 left-3 right-12">
                            <div className="w-1/2 h-2.5 bg-white/30 rounded mb-1.5" />
                            <div className="w-1/3 h-1.5 bg-white/20 rounded" />
                        </div>
                        {/* Right Interaction Sidebar */}
                        <div className="absolute right-1.5 bottom-16 flex flex-col gap-3 items-center">
                            <div className="w-6 h-6 rounded-full bg-white/30" />
                            <div className="w-6 h-6 rounded-full bg-white/30" />
                            <div className="w-6 h-6 rounded-full bg-white/30" />
                        </div>
                    </>
                )}

                {previewPlatform === 'tiktok' && (
                    <>
                        {/* Bottom Caption Area */}
                        <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-black/20" />
                        <div className="absolute bottom-10 left-3 right-16">
                            <div className="w-3/4 h-3 bg-white/30 rounded mb-1.5" />
                            <div className="w-1/2 h-2 bg-white/20 rounded" />
                        </div>
                        {/* Right Sidebar */}
                        <div className="absolute right-2 bottom-24 flex flex-col gap-5 items-center">
                            <div className="w-8 h-8 rounded-full bg-white/30 border-2 border-white/50" />
                            <div className="w-6 h-6 bg-white/30 rounded-md" />
                            <div className="w-6 h-6 bg-white/30 rounded-md" />
                            <div className="w-6 h-6 bg-white/30 rounded-md" />
                        </div>
                    </>
                )}

                {previewPlatform === 'shorts' && (
                    <>
                        <div className="absolute bottom-0 left-0 right-0 h-[20%] bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-5 left-3 right-16">
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <div className="w-5 h-5 rounded-full bg-white/40" />
                                <div className="w-20 h-2 bg-white/30 rounded" />
                            </div>
                            <div className="w-32 h-1.5 bg-white/20 rounded" />
                        </div>
                        <div className="absolute right-3 bottom-12 flex flex-col gap-5 items-center">
                            <div className="w-7 h-7 rounded-full bg-white/30" />
                            <div className="w-7 h-7 rounded-full bg-white/30" />
                        </div>
                    </>
                )}

                {/* Safe Zone Text Guide */}
                <div className="absolute inset-[8%] border border-dashed border-red-500/30 rounded-md flex items-center justify-center">
                    <span className="bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded absolute -top-2 left-1/2 -translate-x-1/2 font-bold uppercase tracking-tighter">
                        Safe Zone
                    </span>
                </div>
            </div>
        );
    };

    const handlePropertySelect = async (propId, preSelectedIds = null) => {
        const prop = properties.find(p => p.PropertyId === parseInt(propId));
        setSelectedProperty(prop);
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/properties/${propId}/images`);
            console.log("=== Property Images API Response ===");
            console.log("Raw API Data:", res.data);
            console.log("Number of images:", res.data.length);

            const mapped = res.data
                .map((img, index) => {
                    const imgUrl = img.url || img.image_url || img.image_path || img.path;
                    console.log(`Image ${index}:`, {
                        id: img.id,
                        rawUrl: imgUrl,
                        type: img.type,
                        allFields: img
                    });

                    return {
                        id: img.id,
                        url: imgUrl,
                        type: img.type || (imgUrl?.match(/\.(mp4|webm|mov)$/) ? 'video' : 'image'),
                        selected: preSelectedIds ? preSelectedIds.includes(img.id) : true
                    };
                })
                .filter(item => {
                    const hasUrl = !!item.url && item.url.trim() !== '';
                    console.log(`Filtering image ${item.id}: hasUrl=${hasUrl}, url="${item.url}"`);
                    return hasUrl;
                });

            console.log("Final mapped media files:", mapped);
            console.log("Number of valid images after filtering:", mapped.length);
            setMediaFiles(mapped);
            setStep(2);
        } catch (err) {
            console.error("Error loading property images:", err);
            showError("Failed to load images");
        } finally {
            setLoading(false);
        }
    };

    const toggleMedia = (id) => {
        setMediaFiles(prev => prev.map(m => m.id === id ? { ...m, selected: !m.selected } : m));
    };

    // Helper to fix image URLs if they are relative
    const getImageUrl = (url) => {
        console.log('getImageUrl called with:', url, 'Type:', typeof url);

        // Return null for falsy values or empty strings
        if (!url || (typeof url === 'string' && url.trim() === '')) {
            console.log('getImageUrl returning null for invalid URL');
            return null;
        }

        // Already a full URL
        if (url.startsWith('http')) {
            console.log('getImageUrl returning full URL:', url);
            return url;
        }

        // Starts with /storage
        if (url.startsWith('/storage')) {
            const fullUrl = `${API_BASE_URL.replace('/api', '')}${url}`;
            console.log('getImageUrl constructed storage URL:', fullUrl);
            return fullUrl;
        }

        // Just a filename - prepend storage path
        const fullUrl = `${API_BASE_URL.replace('/api', '')}/storage/${url}`;
        console.log('getImageUrl constructed filename URL:', fullUrl);
        return fullUrl;
    };

    // Helper function to calculate script duration and video length
    const calculateScriptDuration = (text) => {
        if (!text || text.trim() === '') return { chars: 0, words: 0, ttsDuration: 0, videoDuration: 0 };

        const chars = text.length;
        const words = text.trim().split(/\s+/).length;
        // Average speaking rate: 150 words per minute = 2.5 words per second
        const ttsDuration = Math.ceil(words / 2.5);
        // Video duration = TTS duration + (number of selected images * seconds per image)
        const selectedCount = mediaFiles.filter(m => m.selected).length;
        const imageDuration = selectedCount * 3; // Assuming 3 seconds per image
        const videoDuration = Math.max(ttsDuration, imageDuration);

        return { chars, words, ttsDuration, videoDuration };
    };

    const [uploadedFiles, setUploadedFiles] = useState([]);

    const handleUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const toastId = toast.loading("Uploading Media...");
        const newUploads = [];

        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append('file', file);

                const res = await axios.post(`${API_BASE_URL}/admin/media/upload`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${localStorage.getItem('admin_token')}`
                    }
                });
                console.log('📤 Uploaded file response:', res.data);
                const uploadedUrl = res.data.url || res.data.path;
                console.log('📤 Using URL for uploaded file:', uploadedUrl);

                newUploads.push({
                    id: 'custom-' + Date.now() + Math.random(),
                    url: uploadedUrl, // URL for preview
                    path: res.data.path, // Path for backend
                    type: res.data.type,
                    selected: true,
                    isCustom: true
                });
            }
            // Add to main media list for selection
            setMediaFiles(prev => [...prev, ...newUploads]);
            toast.success("Upload Complete!", { id: toastId });
        } catch (err) {
            console.error(err);
            toast.error("Upload failed", { id: toastId });
        }
    };

    const handleAutoGenerateScript = async () => {
        if (!selectedProperty) return showError("Select a property first");
        setIsGeneratingScript(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/admin/video-generator/generate-script`, {
                property_id: selectedProperty.PropertyId,
                vibe: mood
            }, { headers: { Authorization: `Bearer ${token}` } });

            setScript(res.data.script);
            showSuccess("Script Generated!");
        } catch (err) {
            showError("Failed to generate script");
        } finally {
            setIsGeneratingScript(false);
        }
    };

    const handleGenerate = async () => {
        setStep(4);
        setJobStatus('pending');
        const selectedIds = mediaFiles.filter(m => m.selected).map(m => m.id);

        try {
            const res = await axios.post(`${API_BASE_URL}/admin/video-generator/render`, {
                property_id: selectedProperty.PropertyId,
                template_id: mood,
                bundle_mode: true, // NEW FLAG for Dual Output
                options: {
                    title: selectedProperty.Name,
                    subtitle: selectedProperty.Location,
                    media_ids: selectedIds.filter(id => !String(id).startsWith('custom-')), // Only real IDs
                    media_paths: mediaFiles.filter(m => m.selected && m.isCustom).map(m => m.path), // Custom paths
                    mood: mood,
                    script: useVoiceover ? script : null,
                    voice_id: useVoiceover ? voiceId : null
                }
            }, { headers: { Authorization: `Bearer ${token}` } });

            setJobId(res.data.job_id);
            fetchJobs(); // Refresh list
            pollJob(res.data.job_id);
        } catch (err) {
            setJobStatus('failed');
            showError("Failed to start generation");
        }
    };

    const pollJob = (id) => {
        const interval = setInterval(async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/admin/video-generator/jobs/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setJobStatus(res.data.status);
                if (res.data.status === 'completed') {
                    clearInterval(interval);
                    setProject(res.data); // Should contain reel_url and post_url logic
                    showSuccess("Video Bundle Generated!");
                } else if (res.data.status === 'failed') {
                    clearInterval(interval);
                    showError(res.data.error || 'Generation Failed');
                }
            } catch (err) {
                clearInterval(interval);
            }
        }, 3000);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-pink-200">
                        <FaInstagram size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">AI Social Video Studio (v2.3)</h1>
                        <p className="text-gray-500 text-sm">Generate viral Instagram Reels & Posts instantly.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {/* CONFIG + MEDIA */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Step 1: Select */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs">1</span>
                            Property Selection
                        </h3>
                        <select
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-pink-500 transition"
                            onChange={(e) => handlePropertySelect(e.target.value)}
                            value={selectedProperty?.PropertyId || ''}
                            disabled={step > 2}
                        >
                            <option value="">-- Choose Property --</option>
                            {properties.map(p => (
                                <option key={p.PropertyId} value={p.PropertyId}>{p.Name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Step 2: Media Grid */}
                    {step >= 2 && step !== 4 && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs">2</span>
                                    Curate Media ({mediaFiles.filter(m => m.selected).length})
                                </h3>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-3 border-r pr-3 border-gray-100 mr-2">
                                        <label className="flex items-center gap-1.5 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={showSafeZones}
                                                onChange={e => setShowSafeZones(e.target.checked)}
                                                className="w-3.5 h-3.5 rounded text-pink-600 focus:ring-pink-500"
                                            />
                                            <span className="text-[10px] font-bold text-gray-400 group-hover:text-pink-600 transition">Safe Zones</span>
                                        </label>
                                        <select
                                            value={previewPlatform}
                                            onChange={e => setPreviewPlatform(e.target.value)}
                                            className="text-[10px] font-bold bg-gray-50 border-0 p-1 rounded focus:ring-0 outline-none"
                                        >
                                            <option value="none">Platform UI: Off</option>
                                            <option value="instagram">Instagram Reel</option>
                                            <option value="tiktok">TikTok</option>
                                            <option value="shorts">YouTube Shorts</option>
                                        </select>
                                    </div>
                                    <label className="cursor-pointer bg-pink-50 text-pink-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-pink-100 flex items-center gap-1 transition">
                                        <FaCloudUploadAlt /> Upload Media
                                        <input type="file" multiple onChange={handleUpload} className="hidden" accept="image/*,video/*" />
                                    </label>
                                    <button className="text-xs text-gray-400 hover:text-gray-600" onClick={() => setMediaFiles(mediaFiles.map(m => ({ ...m, selected: true })))}>Select All</button>
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 mb-2 italic">Drag images to reorder sequence. Click to toggle selection.</p>

                            <Reorder.Group axis="y" values={mediaFiles} onReorder={setMediaFiles} className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {mediaFiles.map((item, mapIndex) => {
                                    console.log(`🖼️ Rendering media item ${mapIndex}:`, item);
                                    const imageUrl = getImageUrl(item.url);
                                    console.log(`🖼️ Computed imageUrl for item ${mapIndex}:`, imageUrl);

                                    return (
                                        <Reorder.Item key={item.id} value={item} className="relative">
                                            <div
                                                onClick={() => toggleMedia(item.id)}
                                                className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all group ${item.selected ? 'border-pink-500 ring-2 ring-pink-100 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                            >
                                                <SafeZoneOverlay />
                                                {item.type === 'video' ? (
                                                    imageUrl ? (
                                                        <video src={imageUrl} className="w-full h-full object-cover" muted />
                                                    ) : (
                                                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">No Video</div>
                                                    )
                                                ) : (
                                                    imageUrl ? (
                                                        <img src={imageUrl} alt="media" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">No Image</div>
                                                    )
                                                )}

                                                {item.selected && (
                                                    <div className="absolute top-2 right-2 bg-pink-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs shadow-md">
                                                        <FaCheck />
                                                    </div>
                                                )}
                                                {item.isCustom && (
                                                    <div className="absolute bottom-2 right-2 bg-blue-500 text-white text-[10px] px-1 rounded shadow-md">
                                                        Custom
                                                    </div>
                                                )}
                                            </div>
                                        </Reorder.Item>
                                    );
                                })}
                            </Reorder.Group>
                            <Reorder.Group axis="x" values={mediaFiles} onReorder={setMediaFiles} className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar">
                                {mediaFiles.map((media) => (
                                    <Reorder.Item key={media.id} value={media} className="flex-shrink-0 w-24 h-24">
                                        <div
                                            onClick={() => toggleMedia(media.id)}
                                            className={`relative w-full h-full rounded-lg overflow-hidden cursor-pointer transition-all ${media.selected ? 'ring-2 ring-pink-500 scale-100' : 'opacity-50 grayscale scale-95'}`}
                                        >
                                            {getImageUrl(media.url) && (
                                                <img src={getImageUrl(media.url)} className="w-full h-full object-cover select-none" alt="" draggable={false} />
                                            )}
                                            {media.selected && (
                                                <div className="absolute top-1 right-1 bg-pink-500 text-white rounded-full p-1 shadow">
                                                    <FaCheck size={8} />
                                                </div>
                                            )}
                                        </div>
                                    </Reorder.Item>
                                ))}
                            </Reorder.Group>
                        </div>
                    )}
                </div>

                {/* PREVIEW + CONTROLS */}
                <div className="space-y-6">
                    {/* Controls */}
                    {step >= 2 && step !== 4 && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs">3</span>
                                Style & Vibe
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase">Mood</label>
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        {['luxury', 'party', 'family', 'reels'].map(m => (
                                            <button
                                                key={m}
                                                onClick={() => setMood(m)}
                                                className={`p-2 rounded-lg text-xs font-bold capitalize border transition ${mood === m ? 'bg-pink-50 border-pink-500 text-pink-700' : 'border-gray-200'}`}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Voiceover Controls */}
                                <div className="border-t border-gray-100 pt-4">
                                    <label className="flex items-center gap-2 cursor-pointer mb-3">
                                        <input
                                            type="checkbox"
                                            checked={useVoiceover}
                                            onChange={(e) => setUseVoiceover(e.target.checked)}
                                            className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500"
                                        />
                                        <span className="font-bold text-gray-700 text-sm">Add AI Voiceover</span>
                                    </label>

                                    {useVoiceover && (
                                        <div className="space-y-4 rounded-lg bg-gray-50 p-4 border border-gray-100">
                                            <div className="flex justify-between items-center">
                                                <label className="text-xs font-bold text-gray-500 uppercase">Input Script</label>
                                                <button
                                                    onClick={handleAutoGenerateScript}
                                                    disabled={isGeneratingScript || !selectedProperty}
                                                    className="text-xs flex items-center gap-1 text-indigo-600 font-bold hover:underline disabled:opacity-50"
                                                >
                                                    {isGeneratingScript ? <FaSpinner className="animate-spin" /> : <FaMagic />}
                                                    Auto-Write Script
                                                </button>
                                            </div>
                                            <textarea
                                                className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:border-pink-500 outline-none"
                                                rows="4"
                                                placeholder="Enter script here (e.g. Welcome to this beautiful resort...)"
                                                value={script}
                                                onChange={(e) => setScript(e.target.value)}
                                            />

                                            {/* Script Duration Calculator */}
                                            {script && (() => {
                                                const { chars, words, ttsDuration, videoDuration } = calculateScriptDuration(script);
                                                return (
                                                    <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                                            <div>
                                                                <span className="text-gray-500">Characters:</span>
                                                                <span className="ml-2 font-bold text-gray-700">{chars}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-500">Words:</span>
                                                                <span className="ml-2 font-bold text-gray-700">{words}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-500">TTS Duration:</span>
                                                                <span className="ml-2 font-bold text-blue-600">~{ttsDuration}s</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-500">Video Length:</span>
                                                                <span className="ml-2 font-bold text-green-600">~{videoDuration}s</span>
                                                            </div>
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-2 italic">
                                                            💡 Video length = max(TTS duration, {mediaFiles.filter(m => m.selected).length} images × 3s)
                                                        </p>
                                                    </div>
                                                );
                                            })()}

                                            <div>
                                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Voice</label>
                                                <select
                                                    className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none"
                                                    value={voiceId}
                                                    onChange={(e) => setVoiceId(e.target.value)}
                                                >
                                                    {voices.map(v => (
                                                        <option key={v.id} value={v.id}>
                                                            {v.name}
                                                        </option>
                                                    ))}
                                                    {voices.length === 0 && <option value="atlas">Atlas (Default)</option>}
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={handleGenerate}
                                    className="w-full py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition transform active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <FaMagic /> Generate Video Bundle
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Loading / Result */}
                    {step === 4 && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                            {jobStatus !== 'completed' ? (
                                <div className="py-10">
                                    <FaSpinner className="text-4xl text-pink-500 animate-spin mx-auto mb-4" />
                                    <h3 className="font-bold text-lg">Creating Magic...</h3>
                                    <p className="text-gray-500 text-sm mt-2">Generating Reel & Post formats.</p>
                                    {jobStatus === 'failed' && (
                                        <div className="text-red-500 mt-4 text-xs font-bold">
                                            Generation Failed. <button onClick={() => setStep(3)} className="underline">Retry</button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <FaCheck size={32} />
                                    </div>
                                    <h3 className="font-bold text-xl text-gray-800">Ready to Post!</h3>

                                    {/* Reel Download */}
                                    <a
                                        href={`${API_BASE_URL.replace('/api', '')}/storage/${project?.output_path}`}
                                        download
                                        target="_blank"
                                        className="block w-full py-3 bg-pink-100 text-pink-700 rounded-xl font-bold hover:bg-pink-200 transition flex items-center justify-center gap-2"
                                    >
                                        <FaInstagram /> Download Reel (9:16)
                                    </a>

                                    {/* Post Download (Placeholder untill backend returns explicit field) */}
                                    {project?.options?.post_path && (
                                        <a
                                            href={`${API_BASE_URL.replace('/api', '')}/storage/${project.options.post_path}`}
                                            download
                                            target="_blank"
                                            className="block w-full py-3 bg-indigo-100 text-indigo-700 rounded-xl font-bold hover:bg-indigo-200 transition flex items-center justify-center gap-2"
                                        >
                                            <FaImage /> Download Post (1:1)
                                        </a>
                                    )}

                                    <button onClick={() => setStep(1)} className="text-xs text-gray-400 hover:text-gray-600 mt-4 underline">Create Another</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <div className="mt-12 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <FaLayerGroup className="text-pink-600" /> Recent Projects
                    </h3>
                    <button onClick={fetchJobs} className="text-xs text-pink-600 hover:underline">Refresh</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                            <tr>
                                <th className="p-4">Property</th>
                                <th className="p-4">Date</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Mood</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {jobs.map(job => (
                                <tr key={job.id} className="hover:bg-gray-50 transition">
                                    <td className="p-4 font-medium text-gray-900">
                                        {job.property?.Name || 'Unknown'}
                                    </td>
                                    <td className="p-4 text-gray-500 text-xs">
                                        {new Date(job.created_at).toLocaleString()}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider w-max
                                                ${job.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                    job.status === 'failed' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-700 animate-pulse'}`}>
                                                {job.status}
                                            </span>
                                            {job.status === 'failed' && (
                                                <span className="text-[10px] text-red-500 mt-1 max-w-[150px] truncate" title={job.error_message || 'Unknown Error'}>
                                                    {job.error_message || 'Error'}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 capitalize text-gray-600">{job.options?.mood || 'Default'}</td>
                                    <td className="p-4 text-right flex justify-end gap-2">
                                        {job.status === 'completed' && (
                                            <>
                                                <a
                                                    href={`${API_BASE_URL.replace('/api', '')}/storage/${job.output_path}`}
                                                    download
                                                    target="_blank"
                                                    title="Download Reel"
                                                    className="p-2 bg-pink-50 text-pink-600 rounded hover:bg-pink-100"
                                                >
                                                    <FaInstagram />
                                                </a>
                                                {job.options?.post_path && (
                                                    <a
                                                        href={`${API_BASE_URL.replace('/api', '')}/storage/${job.options.post_path}`}
                                                        download
                                                        target="_blank"
                                                        title="Download Post"
                                                        className="p-2 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100"
                                                    >
                                                        <FaImage />
                                                    </a>
                                                )}
                                            </>
                                        )}
                                        {job.status === 'failed' && (
                                            <button
                                                onClick={() => handleRetry(job.id)}
                                                className="p-2 bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100"
                                                title="Retry Job"
                                            >
                                                <FaSync />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleEdit(job)}
                                            className="p-2 bg-gray-50 text-gray-600 rounded hover:bg-gray-100"
                                            title="Edit/Reload"
                                        >
                                            <FaPalette />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(job.id)}
                                            className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100"
                                            title="Delete"
                                        >
                                            <FaTimes />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {jobs.length === 0 && (
                                <tr><td colSpan="4" className="p-8 text-center text-gray-400">No projects found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
