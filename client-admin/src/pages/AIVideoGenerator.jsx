import React, { useState, useEffect } from 'react';
import { FaVideo, FaImage, FaMagic, FaMusic, FaCheck, FaPlay, FaDownload, FaShareAlt, FaSpinner, FaTimes, FaChild, FaHashtag, FaSync } from 'react-icons/fa';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import Loader from '../components/Loader';

export default function AIVideoGenerator() {
    const { token } = useAuth();
    const { showSuccess, showError } = useModal();

    // Steps: 1=Select, 2=Curate, 3=Customize, 4=Processing/Result
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Data
    const [properties, setProperties] = useState([]);
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [mediaFiles, setMediaFiles] = useState([]);
    const [jobId, setJobId] = useState(null);
    const [jobStatus, setJobStatus] = useState(null); // pending, processing, completed, failed
    const [resultUrl, setResultUrl] = useState(null);

    // Options
    const [selectedTemplate, setSelectedTemplate] = useState('luxury');
    const [mood, setMood] = useState('luxury'); // Matches template initially
    const [customText, setCustomText] = useState({ title: '', subtitle: '', cta: 'Book Now' });

    // Templates Configuration (Updated with Moods)
    const templates = [
        { id: 'luxury', name: 'Luxury Showcase', desc: 'Slow zooms, cinematic fades.', icon: <FaHotel />, defaultMood: 'luxury' },
        { id: 'party', name: 'Party Vibes', desc: 'Fast cuts, upbeat energy.', icon: <FaGlassCheers />, defaultMood: 'party' },
        { id: 'family', name: 'Family Escape', desc: 'Warm tones, steady shots.', icon: <FaChild />, defaultMood: 'family' },
        { id: 'reels', name: 'Viral Reel', desc: 'Trending audio, quick pace.', icon: <FaHashtag />, defaultMood: 'reels' },
    ];

    const moods = [
        { id: 'luxury', label: 'Ambient / Deep House (80 BPM)' },
        { id: 'party', label: 'EDM / Pop (120 BPM)' },
        { id: 'family', label: 'Acoustic / Chill (100 BPM)' },
        { id: 'reels', label: 'Trending Beat (128 BPM)' }
    ];

    // Fetch Properties on Mount
    useEffect(() => {
        fetchProperties();
    }, []);

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

    // Fetch Media when Property Selected
    const handlePropertySelect = async (propId) => {
        const prop = properties.find(p => p.PropertyId === parseInt(propId));
        setSelectedProperty(prop);
        setCustomText({
            title: prop.Name,
            subtitle: prop.Location, // Default location
            cta: 'Book on ResortWala'
        });
        // Reset mood to default of first template
        setMood('luxury');

        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/properties/${propId}/images`);
            const mapped = res.data.map(img => ({
                id: img.id,
                url: img.image_url,
                selected: true
            }));
            setMediaFiles(mapped);
            setStep(2);
        } catch (err) {
            showError("Failed to load images");
        } finally {
            setLoading(false);
        }
    };

    // Toggle Media Selection
    const toggleMedia = (id) => {
        setMediaFiles(prev => prev.map(m => m.id === id ? { ...m, selected: !m.selected } : m));
    };

    // Submit Job
    const handleGenerate = async () => {
        setStep(4);
        setJobStatus('pending');

        const selectedIds = mediaFiles.filter(m => m.selected).map(m => m.id);

        try {
            const res = await axios.post(`${API_BASE_URL}/admin/video-generator/render`, {
                property_id: selectedProperty.PropertyId,
                template_id: mood, // Use mood as the driver for logic now (or pass both)
                options: {
                    ...customText,
                    media_ids: selectedIds,
                    mood: mood // Explicitly pass mood
                }
            }, { headers: { Authorization: `Bearer ${token}` } });

            setJobId(res.data.job_id);
            fetchJobs(); // Refresh list immediately
            pollJob(res.data.job_id);
        } catch (err) {
            setJobStatus('failed');
            showError("Failed to start generation");
        }
    };

    const handleRetry = async (id) => {
        try {
            await axios.post(`${API_BASE_URL}/admin/voice-studio/video-jobs/${id}/retry`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchJobs();
            showSuccess('Job retry started.');
        } catch (error) {
            console.error(error);
            showError('Failed to retry job.');
        }
    };

    const [jobs, setJobs] = useState([]);

    // Fetch Properties and Jobs on Mount
    useEffect(() => {
        fetchProperties();
        fetchJobs();
        const interval = setInterval(fetchJobs, 10000); // Polling list every 10s
        return () => clearInterval(interval);
    }, []);

    const fetchJobs = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/video-generator`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setJobs(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    // Polling Logic
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
                    setResultUrl(res.data.url);
                    showSuccess("Video Generated Successfully!");
                } else if (status === 'failed') {
                    clearInterval(interval);
                    showError("Video Generation Failed: " + (res.data.error || 'Unknown Error'));
                }
            } catch (err) {
                clearInterval(interval); // Stop on network error to avoid infinite loop
            }
        }, 2000); // Check every 2s
    };

    const loadJob = (j) => {
        setJobId(j.id);
        setJobStatus(j.status);
        if (j.status === 'completed' && j.output_path) {
            setResultUrl(`${API_BASE_URL.replace('/api', '')}/storage/${j.output_path}`);
        }
        setStep(4);
        if (j.status === 'pending' || j.status === 'processing') {
            pollJob(j.id);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-10">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-200">
                    <FaMagic size={20} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">AI Video Generator</h1>
                    <p className="text-gray-500 text-sm">Create viral marketing videos from your property listings in seconds.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">

                {/* LEFT: Configuration Panel */}
                <div className="lg:col-span-1 space-y-6">

                    {/* Step 1: Property */}
                    <div className={`bg-white p-5 rounded-2xl shadow-sm border transition-all ${step === 1 ? 'border-purple-500 ring-4 ring-purple-50' : 'border-gray-100 opacity-60'}`}>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold">1</span>
                            <h3 className="font-bold text-gray-800">Select Property</h3>
                        </div>
                        <select
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-purple-500 transition"
                            onChange={(e) => handlePropertySelect(e.target.value)}
                            value={selectedProperty?.PropertyId || ''}
                            disabled={step > 2} // Lock after selection for simplicity
                        >
                            <option value="">-- Choose a Property --</option>
                            {properties.map(p => (
                                <option key={p.PropertyId} value={p.PropertyId}>{p.Name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Step 3: Template & Text (Shown only after prop select) */}
                    {step >= 2 && (
                        <div className={`bg-white p-5 rounded-2xl shadow-sm border transition-all ${step === 2 || step === 3 ? 'border-purple-500 ring-4 ring-purple-50' : 'border-gray-100'}`}>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold">3</span>
                                <h3 className="font-bold text-gray-800">Style & Branding</h3>
                            </div>

                            {/* Templates */}
                            <div className="space-y-3 mb-6">
                                <label className="text-xs font-bold text-gray-400 uppercase">Video Style</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {templates.map(t => (
                                        <div
                                            key={t.id}
                                            onClick={() => { setSelectedTemplate(t.id); setMood(t.defaultMood); }}
                                            className={`cursor-pointer p-3 rounded-xl border flex flex-col items-center text-center gap-2 transition-all ${selectedTemplate === t.id ? 'bg-purple-50 border-purple-500 text-purple-700' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                                        >
                                            <div className="text-xl">{t.icon}</div>
                                            <span className="text-xs font-bold">{t.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Mood / Audio */}
                            <div className="space-y-3 mb-6">
                                <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2"><FaMusic /> Audio Vibe</label>
                                <select
                                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                                    value={mood}
                                    onChange={(e) => setMood(e.target.value)}
                                >
                                    {moods.map(m => (
                                        <option key={m.id} value={m.id}>{m.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Text Inputs */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-gray-400 uppercase">Text Overlays</label>
                                <input
                                    type="text"
                                    placeholder="Main Title"
                                    value={customText.title}
                                    onChange={e => setCustomText({ ...customText, title: e.target.value })}
                                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                                />
                                <input
                                    type="text"
                                    placeholder="Location / Subtitle"
                                    value={customText.subtitle}
                                    onChange={e => setCustomText({ ...customText, subtitle: e.target.value })}
                                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                                />
                                <input
                                    type="text"
                                    placeholder="Call To Action"
                                    value={customText.cta}
                                    onChange={e => setCustomText({ ...customText, cta: e.target.value })}
                                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                                />
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={step === 4}
                                className="w-full mt-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/40 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <FaMagic /> Generate Video
                            </button>
                        </div>
                    )}
                </div>

                {/* RIGHT: Preview / Media Area */}
                <div className="lg:col-span-2 space-y-6">

                    {/* PREVIEW RESULT (Step 4) */}
                    {step === 4 && (
                        <div className="bg-black rounded-2xl overflow-hidden aspect-[9/16] max-w-sm mx-auto shadow-2xl relative group">
                            {/* Status Overlay */}
                            {jobStatus !== 'completed' && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10 text-white">
                                    {jobStatus === 'failed' ? (
                                        <>
                                            <FaTimes className="text-red-500 text-4xl mb-4" />
                                            <p className="font-bold">Generation Failed</p>
                                            <button onClick={() => setStep(3)} className="mt-4 text-sm underline text-gray-400">Try Again</button>
                                        </>
                                    ) : (
                                        <>
                                            <FaSpinner className="text-purple-500 text-4xl mb-4 animate-spin" />
                                            <p className="font-bold animate-pulse">{jobStatus === 'pending' ? 'Queued...' : 'Rendering with AI...'}</p>
                                            <p className="text-xs text-gray-500 mt-2">This usually takes ~10-20 seconds</p>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Video Player */}
                            {jobStatus === 'completed' && resultUrl && (
                                <>
                                    <video src={resultUrl} controls autoPlay loop className="w-full h-full object-cover" />
                                    <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <a href={resultUrl} download className="p-3 bg-white text-black rounded-full shadow-lg hover:scale-110 transition"><FaDownload /></a>
                                        <button className="p-3 bg-green-500 text-white rounded-full shadow-lg hover:scale-110 transition"><FaShareAlt /></button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}


                    {/* MEDIA GRID (Step 2) */}
                    {step >= 2 && step !== 4 && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                    <FaImage className="text-gray-400" /> Media Selection
                                </h3>
                                <span className="text-xs font-bold bg-purple-100 text-purple-700 px-2 py-1 rounded-lg">
                                    {mediaFiles.filter(m => m.selected).length} selected
                                </span>
                            </div>

                            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                {mediaFiles.map((media) => (
                                    <div
                                        key={media.id}
                                        onClick={() => toggleMedia(media.id)}
                                        className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer group transition-all ${media.selected ? 'ring-2 ring-purple-500 scale-95' : 'opacity-60 hover:opacity-100'}`}
                                    >
                                        <img src={media.url} className="w-full h-full object-cover" alt="" />
                                        <div className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-sm transition ${media.selected ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                            <FaCheck />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-gray-400 mt-3 text-center">Select the best 5-10 photos for optimal results.</p>
                        </div>
                    )}

                    {/* Empty State */}
                    {step === 1 && (
                        <div className="flex flex-col items-center justify-center h-[400px] border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                            <FaVideo className="text-gray-300 text-6xl mb-4" />
                            <p className="text-gray-500 font-medium">Select a property to load content</p>
                        </div>
                    )}

                </div>
            </div>

            {/* Recent Generations History */}
            <div className="max-w-7xl mx-auto mt-12 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <FaVideo className="text-purple-600" /> Recent Generations
                    </h3>
                    <button onClick={fetchJobs} className="text-xs text-purple-600 hover:underline">Refresh</button>
                </div>
                {/* ... (keep table content same, just fixing structure) ... */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                            <tr>
                                <th className="p-4">Property</th>
                                <th className="p-4">Style</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Created</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {jobs.map(job => (
                                <tr key={job.id} className="hover:bg-gray-50 transition">
                                    <td className="p-4 font-medium text-gray-900">
                                        {job.property?.Name || 'Unknown Property'}
                                    </td>
                                    <td className="p-4">
                                        <span className="capitalize px-2 py-1 bg-gray-100 rounded text-xs font-bold text-gray-600">
                                            {job.template_id}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider
                                            ${job.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                job.status === 'failed' ? 'bg-red-100 text-red-700' :
                                                    'bg-yellow-100 text-yellow-700 animate-pulse'}`}>
                                            {job.status}
                                        </span>
                                        {job.status === 'failed' && job.error_message && (
                                            <div className="text-[10px] text-red-600 mt-1 max-w-[150px] leading-tight truncate" title={job.error_message}>
                                                {job.error_message}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 text-gray-500 text-xs">
                                        {new Date(job.created_at).toLocaleString()}
                                    </td>
                                    <td className="p-4 text-right flex justify-end gap-2">
                                        {job.status === 'failed' && (
                                            <button
                                                onClick={() => handleRetry(job.id)}
                                                className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
                                                title="Retry Generation"
                                            >
                                                <FaSync className="animate-hover-spin" size={12} />
                                            </button>
                                        )}
                                        {job.status === 'completed' && (
                                            <>
                                                <button
                                                    onClick={() => loadJob(job)}
                                                    className="p-2 bg-purple-50 text-purple-600 rounded hover:bg-purple-100 transition"
                                                    title="Play"
                                                >
                                                    <FaPlay size={12} />
                                                </button>
                                                <a
                                                    href={`${API_BASE_URL.replace('/api', '')}/storage/${job.output_path}`}
                                                    download
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-2 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition"
                                                    title="Download"
                                                >
                                                    <FaDownload size={12} />
                                                </a>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {jobs.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-400 italic">No recent video jobs found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// Dummy Icon Components (Replace with react-icons imports at top)
const FaHotel = () => <FaVideo />;
const FaGlassCheers = () => <FaMusic />;
