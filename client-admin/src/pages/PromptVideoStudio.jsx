import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaMagic, FaVideo, FaMusic, FaMicrophoneAlt, FaCloudUploadAlt, FaPlayCircle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const API_BASE_URL = 'https://api.resortwala.com/api';

const PromptVideoStudio = () => {
    const [step, setStep] = useState(1); // 1: Input, 2: Review, 3: Generating
    const [prompt, setPrompt] = useState('');
    const [mood, setMood] = useState('energetic');
    const [aspectRatio, setAspectRatio] = useState('9:16');
    const [voiceId, setVoiceId] = useState('atlas');

    const [generatedScript, setGeneratedScript] = useState('');
    const [jobId, setJobId] = useState(null);
    const [processing, setProcessing] = useState(false);

    // Mock Voices (Should fetch from API ideally)
    const voices = [
        { id: 'atlas', name: 'Atlas (Male)' },
        { id: 'aura', name: 'Aura (Female)' },
        { id: 'echo', name: 'Echo (Male)' },
        { id: 'shimmer', name: 'Shimmer (Female)' }
    ];

    const handleSubmitPrompt = async () => {
        if (!prompt) return toast.error("Please enter a prompt!");
        setProcessing(true);
        setStep(2); // Move to review step immediately (simulating analysis)

        // We could call a pre-analysis endpoint here, but we'll do it all in 'generate' for V1 efficiency
        // OR we can generate script first.
        try {
            // Let's analyze script first
            const res = await axios.post(`${API_BASE_URL}/admin/ai-video-generator/generate-script`, {
                property_id: 0, // Generic
                topic: prompt, // Use prompt as topic
                language: 'en'
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
            });
            if (res.data.script) {
                setGeneratedScript(res.data.script);
            }
        } catch (err) {
            console.error(err);
            // Fallback
            setGeneratedScript("Experience the ultimate luxury. Book now on ResortWala.");
        }
        setProcessing(false);
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
                script: generatedScript, // Pass edited script if needed? Controller regenerates it currently. 
                // To support script editing, we should pass 'script' override to storePromptVideo?
                // For now, storePromptVideo regenerates. 
                // Improvement: Pass script if user edited it? 
                // Controller line 125: $aiContext always overwrites script.
                // We'll rely on Controller for V1.
            };

            const res = await axios.post(`${API_BASE_URL}/admin/ai-video-generator/prompt-generate`, payload, {
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
                                <span className="text-xs font-bold text-purple-500 uppercase">Generated Script</span>
                                <p className="text-sm text-gray-600 mt-1 italic">"{generatedScript}"</p>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <FaMusic /> Auto-selected Copyright Free Music
                                <br />
                                <FaCloudUploadAlt /> 0 Media Uploaded (Using AI Assets)
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
                                    <p className="text-xs mt-4">Check "Job History" for status.</p>
                                    <button onClick={() => setStep(1)} className="mt-6 text-green-800 underline font-bold">Create Another</button>
                                </div>
                            ) : (
                                <div className="animate-pulse">Creating...</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PromptVideoStudio;
