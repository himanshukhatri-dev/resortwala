import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaMagic, FaVideo, FaMusic, FaMicrophoneAlt, FaCloudUploadAlt, FaPlayCircle, FaUndo } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

import { API_BASE_URL } from '../config';

const PromptVideoStudio = () => {
    const [step, setStep] = useState(1); // 1: Input, 2: Review, 3: Generating
    const [prompt, setPrompt] = useState('');
    const [mood, setMood] = useState('energetic');
    const [aspectRatio, setAspectRatio] = useState('9:16');
    const [voiceId, setVoiceId] = useState('atlas');

    const [generatedScript, setGeneratedScript] = useState('');
    const [scenes, setScenes] = useState([]);
    const [jobId, setJobId] = useState(null);
    const [jobs, setJobs] = useState([]);

    // Mock Voices (Should fetch from API ideally)
    const voices = [
        { id: 'atlas', name: 'Atlas (Male)' },
        { id: 'aura', name: 'Aura (Female)' },
        { id: 'arjun', name: 'Arjun (Indian Male)' },
        { id: 'mira', name: 'Mira (Indian Female)' },
        { id: 'dev', name: 'Dev (Hindi Male)' },
        { id: 'zara', name: 'Zara (Hindi Female)' },
        { id: 'manohar', name: 'Manohar (Marathi Male)' },
        { id: 'aarohi', name: 'Aarohi (Marathi Female)' }
    ];

    const fetchJobs = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/video-generator`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
            });
            setJobs(res.data);
        } catch (err) {
            console.error("Failed to load jobs", err);
        }
    };

    useEffect(() => {
        fetchJobs();
        const interval = setInterval(fetchJobs, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    const handleEdit = (job) => {
        setPrompt(job.options?.prompt || '');
        setMood(job.options?.music_mood || 'energetic');
        setAspectRatio(job.options?.aspect_ratio || '9:16');
        if (job.options?.script) setGeneratedScript(job.options.script);
        if (job.options?.scenes) setScenes(job.options.scenes);

        // Restore Media (Important for retrying custom media jobs)
        if (job.options?.media_paths && Array.isArray(job.options.media_paths)) {
            const restoredFiles = job.options.media_paths.map(path => ({
                path: path,
                url: `${API_BASE_URL}/storage/${path}`, // Construct URL for preview
                type: path.match(/\.(mp4|mov|avi)$/i) ? 'video' : 'image'
            }));
            setUploadedFiles(restoredFiles);
        } else {
            setUploadedFiles([]);
        }

        setStep(1);
        toast.success("Loaded settings from Job #" + job.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ... (Use multi_replace usually, but here I can reach both likely? No, they are far apart. Using single replace for handleEdit first)

    const [processing, setProcessing] = useState(false);

    const handleSubmitPrompt = async () => {
        if (!prompt) return toast.error("Please enter a prompt!");
        setProcessing(true);
        setStep(2);

        try {
            const res = await axios.post(`${API_BASE_URL}/admin/video-generator/generate-script`, {
                property_id: 0,
                topic: prompt,
                language: 'en'
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
            });
            if (res.data.script) {
                setGeneratedScript(res.data.script);
                if (res.data.scenes) setScenes(res.data.scenes);
            }
        } catch (err) {
            console.error(err);
            setGeneratedScript("Experience the ultimate luxury. Book now on ResortWala.");
            // Fallback Scenes
            setScenes([
                { text: "Experience the ultimate luxury.", duration: 4, visual: 'hero' },
                { text: "Book now on ResortWala.", duration: 4, visual: 'logo' }
            ]);
        }
        setProcessing(false);
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
                newUploads.push(res.data);
            }
            setUploadedFiles(prev => [...prev, ...newUploads]);
            toast.success("Upload Complete!", { id: toastId });
        } catch (err) {
            console.error(err);
            toast.error("Upload failed", { id: toastId });
        }
    };

    const handleGenerateVideo = async () => {
        setProcessing(true);
        try {
            const token = localStorage.getItem('admin_token');
            const payload = {
                prompt,
                mood,
                aspect_ratio: aspectRatio,
                voice_id: voiceId,
                voice_id: voiceId,
                script: generatedScript,
                scenes: scenes,
                media_paths: uploadedFiles.map(f => f.path)
            };

            const res = await axios.post(`${API_BASE_URL}/admin/video-generator/prompt-generate`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.job_id) {
                setJobId(res.data.job_id);
                setStep(3);
                toast.success("Magic in progress! Video is rendering.");
            }
        } catch (err) {
            toast.error("Generation Failed: " + (err.response?.data?.error || err.message));
        } finally {
            setProcessing(false);
        }
    };

    const handleRetry = async (job) => {
        if (!confirm('Retry this video generation?')) return;

        const toastId = toast.loading("Retrying job...");
        try {
            const token = localStorage.getItem('admin_token');
            const res = await axios.post(`${API_BASE_URL}/admin/video-generator/jobs/${job.id}/retry`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.status === 'success') {
                toast.success("Retry initiated!", { id: toastId });
                fetchJobs();
            } else {
                toast.error("Retry failed to start.", { id: toastId });
            }
        } catch (err) {
            toast.error("Retry Error: " + (err.response?.data?.message || err.message), { id: toastId });
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this video job? This cannot be undone.')) return;
        try {
            await axios.delete(`${API_BASE_URL}/admin/video-generator/jobs/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
            });
            toast.success("Job Deleted");
            fetchJobs();
        } catch (err) {
            toast.error("Delete Failed: " + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 mb-2 flex items-center gap-2">
                <FaMagic /> Prompt Video Studio
            </h1>
            <p className="text-gray-500 mb-8">Turn text into viral Instagram Reels automatically.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* LEFT: Inputs */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Describe your video</label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="w-full h-32 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                            placeholder="e.g. Create a high-energy video for a pool party in Goa with upbeat music..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Mood</label>
                            <select value={mood} onChange={e => setMood(e.target.value)} className="w-full p-2 border rounded-lg">
                                <option value="energetic">Energetic / Party</option>
                                <option value="luxury">Luxury / Relaxed</option>
                                <option value="nature">Nature / Calm</option>
                                <option value="travel">Travel / Vlog</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Voice</label>
                            <select value={voiceId} onChange={e => setVoiceId(e.target.value)} className="w-full p-2 border rounded-lg">
                                {voices.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Format</label>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setAspectRatio('9:16')}
                                className={`flex-1 py-3 rounded-lg border flex items-center justify-center gap-2 ${aspectRatio === '9:16' ? 'bg-purple-50 border-purple-500 text-purple-700 font-bold' : 'text-gray-500'}`}
                            >
                                <FaVideo /> Reel (9:16)
                            </button>
                            <button
                                onClick={() => setAspectRatio('1:1')}
                                className={`flex-1 py-3 rounded-lg border flex items-center justify-center gap-2 ${aspectRatio === '1:1' ? 'bg-purple-50 border-purple-500 text-purple-700 font-bold' : 'text-gray-500'}`}
                            >
                                <FaVideo /> Post (1:1)
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={step === 1 ? handleSubmitPrompt : handleGenerateVideo}
                        disabled={processing || (step === 1 && !prompt)}
                        className={`w-full py-4 rounded-xl text-white font-bold shadow-lg transition transform active:scale-95 flex items-center justify-center gap-2
                            ${processing ? 'bg-gray-400' : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-purple-500/25'}
                        `}
                    >
                        {processing ? 'Processing...' : (step === 1 ? 'Analyze & Preview' : 'Generate Video')}
                    </button>
                </div>

                {/* RIGHT: Preview / Status */}
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex flex-col items-center justify-center min-h-[400px]">
                    {step === 1 && (
                        <div className="text-center text-gray-400">
                            <FaMagic className="text-6xl mb-4 mx-auto opacity-20" />
                            <p>Enter a prompt to see the magic happen.</p>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="w-full animate-fadeIn">
                            <h3 className="font-bold text-lg mb-4 text-gray-800">✅ AI Execution Plan</h3>

                            <div className="bg-white p-4 rounded-xl shadow-sm mb-4 border border-blue-100">
                                <span className="text-xs font-bold text-blue-500 uppercase">Selected Theme</span>
                                <p className="font-medium capitalize text-gray-700">{mood} &bull; {aspectRatio}</p>
                            </div>

                            <div className="bg-white p-4 rounded-xl shadow-sm mb-4 border border-purple-100">
                                <span className="text-xs font-bold text-class text-purple-500 uppercase flex justify-between">
                                    Timeline Editor <span className="text-gray-400 normal-case overflow-hidden">Re-order & Edit Text</span>
                                </span>
                                <div className="mt-3 space-y-3">
                                    {scenes.map((scene, idx) => (
                                        <div key={idx} className="flex gap-3 items-start bg-gray-50 p-3 rounded-lg border hover:border-purple-300 transition">
                                            <div className="bg-purple-100 text-purple-700 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shrink-0">
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between text-[10px] text-gray-400 uppercase font-bold mb-1">
                                                    <span>{scene.type || 'Scene'}</span>
                                                    <span>{scene.duration}s &bull; {scene.visual}</span>
                                                </div>
                                                <textarea
                                                    value={scene.text}
                                                    onChange={(e) => {
                                                        const newScenes = [...scenes];
                                                        newScenes[idx].text = e.target.value;
                                                        setScenes(newScenes);
                                                        setGeneratedScript(newScenes.map(s => s.text).join(" "));
                                                    }}
                                                    className="w-full text-sm bg-transparent border-0 p-0 focus:ring-0 text-gray-700 resize-none"
                                                    rows={2}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-xl shadow-sm mb-4 border border-blue-100">
                                <span className="text-xs font-bold text-blue-500 uppercase flex justify-between items-center">
                                    Visual Assets
                                    <label className="cursor-pointer bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-blue-100 flex items-center gap-1 transition">
                                        <FaCloudUploadAlt /> Add Photos/Videos
                                        <input type="file" multiple onChange={handleUpload} className="hidden" accept="image/*,video/*" />
                                    </label>
                                </span>

                                {uploadedFiles.length > 0 ? (
                                    <div className="grid grid-cols-4 gap-2 mt-3">
                                        {uploadedFiles.map((f, i) => (
                                            <div key={i} className={`relative rounded-lg overflow-hidden bg-gray-100 border group ${aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-square'}`}>
                                                {f.type === 'video' ? (
                                                    <video src={f.url} className="w-full h-full object-cover" muted />
                                                ) : (
                                                    <img src={f.url} className="w-full h-full object-cover" />
                                                )}
                                                <div className="absolute top-1 right-1 bg-black/50 text-white text-[10px] px-1 rounded">
                                                    {f.type === 'video' ? 'VID' : 'IMG'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-lg mt-2">
                                        No custom media added. <br /> System will use AI stock footage.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="text-center w-full">
                            {jobId ? (
                                <div className="bg-green-50 text-green-700 p-6 rounded-xl border border-green-200">
                                    <FaPlayCircle className="text-5xl mx-auto mb-4 text-green-500" />
                                    <h3 className="font-bold text-xl">Rendering Started!</h3>
                                    <p className="mt-2 text-sm">Job ID: #{jobId}</p>
                                    <p className="text-xs mt-4">Check "Job History" below for status.</p>
                                    <button onClick={() => setStep(1)} className="mt-6 text-green-800 underline font-bold">Create Another</button>
                                </div>
                            ) : (
                                <div className="animate-pulse">Creating...</div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* NEW: Job History */}
            <div className="mt-12">
                <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                    <FaVideo className="text-purple-600" /> Recent Video Jobs
                </h2>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                <th className="p-4">ID / Date</th>
                                <th className="p-4">Prompt</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Remarks</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {jobs.map(job => (
                                <tr key={job.id} className="hover:bg-gray-50/50">
                                    <td className="p-4">
                                        <span className="font-bold text-gray-700">#{job.id}</span>
                                        <div className="text-xs text-gray-400">{new Date(job.created_at).toLocaleString()}</div>
                                    </td>
                                    <td className="p-4 max-w-xs truncate" title={job.options?.prompt || job.options?.title}>
                                        {job.options?.prompt || job.options?.title || 'No Prompt'}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize
                                            ${job.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                job.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}
                                        `}>
                                            {job.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-red-500 text-xs max-w-xs">
                                        {job.error_message || '-'}
                                    </td>
                                    <td className="p-4 text-right flex justify-end gap-2">
                                        {job.status === 'completed' && job.output_path && (
                                            <a href={`https://resortwala.com/storage/${job.output_path}`} target="_blank" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Watch">
                                                <FaPlayCircle size={18} />
                                            </a>
                                        )}
                                        {job.status === 'failed' ? (
                                            <button onClick={() => handleRetry(job)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1 text-xs font-bold" title="Retry with same settings">
                                                <FaUndo /> Retry
                                            </button>
                                        ) : (
                                            <button onClick={() => handleEdit(job)} className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition" title="Reuse Settings">
                                                ✏️
                                            </button>
                                        )}
                                        <button onClick={() => handleDelete(job.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete Job">
                                            🗑️
                                        </button>
                                        <button onClick={() => handleDelete(job.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete Job">
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {jobs.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-400">No videos generated yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PromptVideoStudio;
