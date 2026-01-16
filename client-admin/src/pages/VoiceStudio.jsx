import React, { useState, useEffect } from 'react';
import { FiMic, FiVideo, FiPlay, FiFilm, FiCheck, FiMusic, FiUser } from 'react-icons/fi';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

export default function VoiceStudio() {
    const { token } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Step 1: Voice & Script
    const [script, setScript] = useState('');
    const [selectedVoice, setSelectedVoice] = useState('cinematic_male');
    const [language, setLanguage] = useState('en');
    const [voices, setVoices] = useState([]);

    // Step 2: Visuals
    const [visualType, setVisualType] = useState('cinematic'); // 'avatar' or 'cinematic'
    const [properties, setProperties] = useState([]);
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [selectedMedia, setSelectedMedia] = useState([]);

    // Step 3: Result
    const [projectId, setProjectId] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [videoStatus, setVideoStatus] = useState('idle');

    useEffect(() => {
        fetchConfig();
        fetchProperties();
    }, [token]);

    const fetchConfig = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/voice-studio/config`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data && res.data.voices) {
                setVoices(res.data.voices);
            }
        } catch (e) {
            console.error("Failed to load config", e);
        }
    };

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

    const handlePropertySelect = async (propId) => {
        const prop = properties.find(p => p.PropertyId == propId);
        setSelectedProperty(prop);
        // Load media
        const res = await axios.get(`${API_BASE_URL}/admin/properties/${propId}/images`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        // Select first 5 by default
        setSelectedMedia(res.data.slice(0, 5).map(img => img.id));
    };

    const generateAudio = async () => {
        if (!script) return alert("Enter script");
        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/admin/voice-studio/generate-audio`, {
                script_text: script,
                voice_id: selectedVoice,
                language: language
            }, { headers: { Authorization: `Bearer ${token}` } });

            setProjectId(res.data.project.id);
            setAudioUrl(res.data.audio_url);
            setStep(2);
        } catch (err) {
            console.error(err);
            if (err.response && err.response.status === 500) {
                // Check if it's the migration issue (Table not found)
                const errorMsg = err.response.data.error || "";
                if (errorMsg.includes("Table") || errorMsg.includes("not found") || errorMsg.includes("voice_projects")) {
                    const confirmed = window.confirm("System Error (Database): " + errorMsg + "\n\nRun Auto-Fix?");
                    if (confirmed) {
                        const success = await fixDatabase();
                        if (success) generateAudio();
                    }
                } else {
                    // ALERT THE FULL PAYLOAD FOR DEBUGGING
                    alert("System Error Details:\n" + JSON.stringify(err.response.data, null, 2));
                }
            } else {
                alert("Failed to generate audio: " + err.message);
            }
        }
        setLoading(false);
    };

    const fixDatabase = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/voice-studio/setup-db`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Success: " + res.data.message + ". Retrying generation...");
            return true;
        } catch (e) {
            alert("Auto-Fix Failed: " + e.message);
            return false;
        }
    };

    const renderVideo = async () => {
        if (visualType === 'cinematic' && !selectedProperty) return alert("Select property");
        setVideoStatus('queued');
        try {
            const res = await axios.post(`${API_BASE_URL}/admin/voice-studio/projects/${projectId}/render`, {
                visual_type: visualType,
                visual_options: {
                    property_id: selectedProperty?.PropertyId,
                    media_ids: selectedMedia
                }
            }, { headers: { Authorization: `Bearer ${token}` } });

            alert("Video Rendering Started! Check the Video Generator page for status.");
        } catch (err) {
            setVideoStatus('failed');
            alert("Failed to start render");
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-2 font-display">AI Voice & Avatar Studio</h1>
            <p className="text-gray-500 mb-8">Create professional narrated videos with AI voices.</p>

            {/* Stepper */}
            <div className="flex items-center mb-8 gap-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className={`h-2 flex-1 rounded-full ${step >= i ? 'bg-purple-600' : 'bg-gray-200'}`} />
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">

                    {/* STEP 1: SCRIPT & AUDIO */}
                    {step === 1 && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FiMic /> Script & Voice</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Narrator Voice</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {voices?.map(v => (
                                            <div
                                                key={v.id}
                                                onClick={() => setSelectedVoice(v.id)}
                                                className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedVoice === v.id ? 'bg-purple-50 border-purple-500 ring-1 ring-purple-500' : 'hover:bg-gray-50'}`}
                                            >
                                                <div className="font-bold text-gray-900">{v.name}</div>
                                                <div className="text-xs text-gray-500 uppercase">{v.category}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Script ({language})</label>
                                    <div className="flex gap-2 mb-2">
                                        {['en', 'hi', 'hinglish'].map(l => (
                                            <button key={l} onClick={() => setLanguage(l)} className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${language === l ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}>{l}</button>
                                        ))}
                                    </div>
                                    <textarea
                                        className="w-full h-40 p-4 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                                        placeholder="Enter your script here... Use natural punctuation for best results."
                                        value={script}
                                        onChange={e => setScript(e.target.value)}
                                    />
                                    <div className="text-xs text-right text-gray-400 mt-1">{script.length} chars</div>
                                </div>

                                <button
                                    onClick={generateAudio}
                                    disabled={loading || !script}
                                    className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Generating Voice...' : 'Generate Audio & Continue'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: VISUALS */}
                    {step === 2 && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FiVideo /> Visual Layer</h2>

                            {/* Audio Preview */}
                            {audioUrl && (
                                <div className="bg-purple-50 p-4 rounded-xl mb-6 flex items-center gap-4">
                                    <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center text-purple-700"><FiMusic /></div>
                                    <div className="flex-1">
                                        <div className="text-xs font-bold text-purple-800 uppercase">Audio Generated</div>
                                        <audio controls src={audioUrl} className="h-8 w-full mt-1" />
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <button
                                    onClick={() => setVisualType('avatar')}
                                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 ${visualType === 'avatar' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'opacity-50'}`}
                                >
                                    <FiUser size={24} />
                                    <span className="font-bold">Talking Avatar</span>
                                    <span className="text-xs">(Mock)</span>
                                </button>
                                <button
                                    onClick={() => setVisualType('cinematic')}
                                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 ${visualType === 'cinematic' ? 'bg-purple-50 border-purple-500 text-purple-700' : 'opacity-50'}`}
                                >
                                    <FiFilm size={24} />
                                    <span className="font-bold">Cinematic BG</span>
                                    <span className="text-xs">(Real)</span>
                                </button>
                            </div>

                            {visualType === 'cinematic' && (
                                <div className="space-y-4">
                                    <label className="block text-sm font-semibold">Select Property for Visuals</label>
                                    <select
                                        className="w-full p-3 border rounded-xl"
                                        onChange={(e) => handlePropertySelect(e.target.value)}
                                    >
                                        <option value="">-- Choose Property --</option>
                                        {Array.isArray(properties) && properties.map(p => (
                                            <option key={p.PropertyId} value={p.PropertyId}>{p.Name}</option>
                                        ))}
                                    </select>

                                    {selectedProperty && (
                                        <div className="text-sm text-gray-500">
                                            Found {selectedMedia.length} images. They will be synced to your narration audio.
                                        </div>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={renderVideo}
                                disabled={videoStatus !== 'idle'}
                                className="w-full py-3 mt-6 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all disabled:opacity-50"
                            >
                                {videoStatus === 'queued' ? 'Processing in Background...' : 'Render Final Video'}
                            </button>
                        </div>
                    )}

                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 text-white">
                        <h3 className="font-bold text-lg mb-2">Pro Tips</h3>
                        <ul className="space-y-2 text-sm opacity-90">
                            <li>• Use commas for short pauses.</li>
                            <li>• Use "Quotes" for emphasis.</li>
                            <li>• 1 minute of audio = ~150 words.</li>
                            <li>• Select "Cinematic" for property tours.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
