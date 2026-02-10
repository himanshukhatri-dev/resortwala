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

    // Job State
    const [jobId, setJobId] = useState(null);
    const [jobStatus, setJobStatus] = useState(null);
    const [project, setProject] = useState(null); // Full project data
    const [jobs, setJobs] = useState([]); // History

    // Options
    const [mood, setMood] = useState('luxury');
    const [previewPlatform, setPreviewPlatform] = useState('none');

    // Audio & Transitions
    const [musicVolume, setMusicVolume] = useState(0.1); // 10%
    const [transitionStyle, setTransitionStyle] = useState('fade');
    const [musicSource, setMusicSource] = useState('mood'); // mood | custom
    const [customMusicPath, setCustomMusicPath] = useState(null);

    // TTS State
    const [useVoiceover, setUseVoiceover] = useState(false);
    const [script, setScript] = useState('');
    const [voiceId, setVoiceId] = useState('atlas'); // Default to Atlas
    const [voices, setVoices] = useState([]);
    const [isGeneratingScript, setIsGeneratingScript] = useState(false);

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

    const handlePropertySelect = async (propId, preSelectedIds = null) => {
        const prop = properties.find(p => p.PropertyId === parseInt(propId));
        setSelectedProperty(prop);
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/properties/${propId}/images`);
            const mapped = res.data
                .map((img, index) => {
                    const imgUrl = img.url || img.image_url || img.image_path || img.path;
                    return {
                        id: img.id,
                        url: imgUrl,
                        type: img.type || (imgUrl?.match(/\.(mp4|webm|mov)$/) ? 'video' : 'image'),
                        selected: preSelectedIds ? preSelectedIds.includes(img.id) : true
                    };
                })
                .filter(item => !!item.url && item.url.trim() !== '');

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
        if (!url || (typeof url === 'string' && url.trim() === '')) return null;
        if (url.startsWith('http')) return url;
        if (url.startsWith('/storage')) return `${API_BASE_URL.replace('/api', '')}${url}`;
        return `${API_BASE_URL.replace('/api', '')}/storage/${url}`;
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
                const uploadedUrl = res.data.url || res.data.path;
                newUploads.push({
                    id: 'custom-' + Date.now() + Math.random(),
                    url: uploadedUrl,
                    path: res.data.path,
                    type: res.data.type,
                    selected: true,
                    isCustom: true
                });
            }
            setMediaFiles(prev => [...prev, ...newUploads]);
            toast.success("Upload Complete!", { id: toastId });
        } catch (err) {
            console.error(err);
            toast.error("Upload failed", { id: toastId });
        }
    };

    const handleMusicUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const toastId = toast.loading("Uploading Music...");
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await axios.post(`${API_BASE_URL}/admin/media/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${localStorage.getItem('admin_token')}`
                }
            });
            setCustomMusicPath(res.data.path);
            setMusicSource('custom');
            toast.success("Music Uploaded!", { id: toastId });
        } catch (err) {
            console.error("Music Upload Error:", err);
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
            const PER_SCENE_DURATION = 3;
            let numScenes = selectedIds.length;

            if (useVoiceover && script) {
                const { ttsDuration } = calculateScriptDuration(script);
                const requiredScenes = Math.ceil(ttsDuration / PER_SCENE_DURATION);
                numScenes = Math.max(selectedIds.length, requiredScenes);
            }

            const generatedScenes = Array.from({ length: numScenes }, (_, i) => ({
                text: i === 0 ? selectedProperty.Name : "",
                duration: PER_SCENE_DURATION,
                visual_cue: mood,
            }));

            const payload = {
                property_id: selectedProperty.PropertyId,
                template_id: mood,
                bundle_mode: true,
                options: {
                    title: selectedProperty.Name,
                    subtitle: selectedProperty.Location,
                    media_ids: selectedIds.filter(id => !String(id).startsWith('custom-')),
                    media_paths: mediaFiles.filter(m => m.selected && m.isCustom).map(m => m.path),
                    mood: mood,
                    script: useVoiceover ? script : null,
                    voice_id: useVoiceover ? voiceId : null,
                    scenes: generatedScenes,
                    music_volume: musicVolume,
                    transition_style: transitionStyle,
                    music_source: musicSource,
                    music_path: musicSource === 'custom' ? customMusicPath : null
                }
            };

            const res = await axios.post(`${API_BASE_URL}/admin/video-generator/render`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setJobId(res.data.job_id);
            fetchJobs();
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
                const status = res.data.status;
                setJobStatus(status);

                if (status === 'completed') {
                    clearInterval(interval);
                    setProject(res.data);
                    showSuccess("Video Bundle Generated!");
                } else if (status === 'failed') {
                    clearInterval(interval);
                    showError(res.data.error_message || 'Generation Failed');
                }
            } catch (err) {
                // Don't clear interval immediately on network blip, but log it
                console.error("Polling error:", err);
            }
        }, 4000);
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
                        <h1 className="text-2xl font-bold text-gray-900">AI Social Video Studio (v2.5)</h1>
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

                            <Reorder.Group axis="y" values={mediaFiles} onReorder={setMediaFiles} className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {mediaFiles.map((item) => {
                                    const imageUrl = getImageUrl(item.url);
                                    return (
                                        <Reorder.Item key={item.id} value={item} className="relative">
                                            <div
                                                onClick={() => toggleMedia(item.id)}
                                                className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all group ${item.selected ? 'border-pink-500 ring-2 ring-pink-100 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                            >
                                                {/* SafeZoneOverlay Removed */}
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
                        </div>
                    )}
                </div>

                {/* PREVIEW + CONTROLS */}
                <div className="space-y-6">
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

                                    {/* Music Source */}
                                    <div className="mt-3 bg-gray-50 border border-gray-100 rounded-lg p-3">
                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="flex items-center gap-1.5 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    onChange={() => setMusicSource('mood')}
                                                    checked={musicSource === 'mood'}
                                                    className="text-pink-600"
                                                />
                                                <span className="text-xs font-bold text-gray-700">Mood Music</span>
                                            </label>
                                            <label className="flex items-center gap-1.5 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    onChange={() => setMusicSource('custom')}
                                                    checked={musicSource === 'custom'}
                                                    className="text-pink-600"
                                                />
                                                <span className="text-xs font-bold text-gray-700">Custom Upload</span>
                                            </label>
                                        </div>
                                        {musicSource === 'custom' && (
                                            <div className="mt-2">
                                                <label className="block w-full cursor-pointer bg-white border border-gray-300 border-dashed rounded-lg p-2 text-center hover:bg-gray-50 transition">
                                                    <span className="text-xs text-gray-500 font-bold flex items-center justify-center gap-1">
                                                        {customMusicPath ? '🎵 Music Selected' : '📂 Upload MP3/WAV'}
                                                    </span>
                                                    <input type="file" accept="audio/*" onChange={handleMusicUpload} className="hidden" />
                                                </label>
                                                {customMusicPath && <p className="text-[10px] text-green-600 mt-1 text-center font-mono truncate">{customMusicPath.split('/').pop()}</p>}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Transitions & Audio */}
                                <div className="border-t border-gray-100 pt-4 space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 block mb-1">Transition</label>
                                            <select
                                                value={transitionStyle}
                                                onChange={(e) => setTransitionStyle(e.target.value)}
                                                className="w-full query-sm border-gray-200 rounded p-1 text-xs"
                                            >
                                                <option value="fade">Fade</option>
                                                <option value="wipeleft">Wipe Left</option>
                                                <option value="wiperight">Wipe Right</option>
                                                <option value="slideup">Slide Up</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 block mb-1">Music Vol ({Math.round(musicVolume * 100)}%)</label>
                                            <input
                                                type="range"
                                                min="0" max="1" step="0.1"
                                                value={musicVolume}
                                                onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                                                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Voiceover */}
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
                                                    {isGeneratingScript ? <FaSpinner className="animate-spin" /> : <FaMagic />} Auto-Write
                                                </button>
                                            </div>
                                            <textarea
                                                className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:border-pink-500 outline-none"
                                                rows="4"
                                                placeholder="Enter script..."
                                                value={script}
                                                onChange={(e) => setScript(e.target.value)}
                                            />
                                            {script && (() => {
                                                const { ttsDuration, videoDuration } = calculateScriptDuration(script);
                                                return (
                                                    <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs">
                                                        <span className="text-gray-500">Audio:</span> <span className="font-bold">~{ttsDuration}s</span>
                                                        <span className="mx-2">|</span>
                                                        <span className="text-gray-500">Video:</span> <span className="font-bold text-green-600">~{videoDuration}s</span>
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
                                                    {voices.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                                    {voices.length === 0 && <option value="atlas">Atlas (Default)</option>}
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={handleGenerate}
                                    className="w-full py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2"
                                >
                                    <FaMagic /> Generate Video
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                            {jobStatus !== 'completed' ? (
                                <div className="py-10">
                                    <FaSpinner className="text-4xl text-pink-500 animate-spin mx-auto mb-4" />
                                    <h3 className="font-bold text-lg">
                                        {jobStatus === 'pending' ? 'In Queue...' : 'Rendering Video...'}
                                    </h3>
                                    <p className="text-xs text-gray-400 mt-2">
                                        This might take a few minutes. You can check the history below later.
                                    </p>
                                    {jobStatus === 'failed' && (
                                        <div className="text-red-500 mt-4 text-xs font-bold">
                                            Failed. <button onClick={() => setStep(3)} className="underline">Retry</button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2"><FaCheck size={32} /></div>
                                    <h3 className="font-bold text-xl text-gray-800">Ready!</h3>
                                    <a href={`${API_BASE_URL.replace('/api', '')}/storage/${project?.output_path}`} download target="_blank" className="block w-full py-3 bg-pink-100 text-pink-700 rounded-xl font-bold flex items-center justify-center gap-2"><FaInstagram /> Download Reel</a>
                                    <button onClick={() => setStep(1)} className="text-xs text-gray-400 hover:text-gray-600 mt-4 underline">Create Another</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-12 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2"><FaLayerGroup className="text-pink-600" /> Recent Projects</h3>
                    <button onClick={fetchJobs} className="text-xs text-pink-600 hover:underline">Refresh</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                            <tr><th className="p-4">Property</th><th className="p-4">Date</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {jobs.map(job => (
                                <tr key={job.id} className="hover:bg-gray-50 transition">
                                    <td className="p-4 font-medium text-gray-900">{job.property?.Name || 'Unknown'}</td>
                                    <td className="p-4 text-gray-500 text-xs">{new Date(job.created_at).toLocaleString()}</td>
                                    <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold uppercase ${job.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{job.status}</span></td>
                                    <td className="p-4 text-right">
                                        {job.status === 'completed' && <a href={`${API_BASE_URL.replace('/api', '')}/storage/${job.output_path}`} download target="_blank" className="p-2 bg-pink-50 text-pink-600 rounded hover:bg-pink-100"><FaDownload /></a>}
                                    </td>
                                </tr>
                            ))}
                            {jobs.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-gray-400">No projects found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
