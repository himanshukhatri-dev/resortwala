import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { FiSave, FiArrowLeft, FiPlus, FiImage, FiTrash, FiMove, FiPlay } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function TutorialEditor() {
    const { id } = useParams();
    const { token } = useAuth();
    const navigate = useNavigate();

    const [tutorial, setTutorial] = useState(null);
    const [steps, setSteps] = useState([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchTutorial();
    }, [id]);

    const fetchTutorial = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/tutorials/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTutorial(res.data);
            setSteps(res.data.steps || []);
        } catch (error) {
            toast.error("Failed to load tutorial");
        }
    };

    const addStep = () => {
        setSteps([...steps, {
            id: 'temp_' + Date.now(),
            script_content: '',
            media_path: '',
            duration: 5,
            visual_metadata: {}
        }]);
    };

    const updateStep = (index, field, value) => {
        const newSteps = [...steps];
        newSteps[index][field] = value;
        setSteps(newSteps);
    };

    const removeStep = (index) => {
        const newSteps = [...steps];
        newSteps.splice(index, 1);
        setSteps(newSteps);
    };

    const handleFileUpload = async (index, file) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const loadingToast = toast.loading("Uploading...");
            const res = await axios.post(`${API_BASE_URL}/admin/tutorials/${id}/media`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.dismiss(loadingToast);

            // Update step with new path (assuming backend returns path)
            // Note: In real app, we need full URL.
            updateStep(index, 'media_path', res.data.path);
            toast.success("Uploaded!");
        } catch (error) {
            toast.error("Upload failed");
            console.error(error);
        }
    };

    const saveChanges = async () => {
        setSaving(true);
        try {
            // First update tutorial details if needed (omitted for brevity)

            // Sync Steps
            await axios.post(`${API_BASE_URL}/admin/tutorials/${id}/steps`, { steps }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success("Saved successfully!");
            fetchTutorial(); // Reload
        } catch (error) {
            toast.error("Failed to save");
        }
        setSaving(false);
    };

    const handleRender = async () => {
        try {
            toast.loading("Starting Render...");
            const res = await axios.post(`${API_BASE_URL}/admin/tutorials/${id}/render`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.dismiss();
            toast.success("Render Started! Job ID: " + res.data.job_id);
            // Poll for status or navigate to a jobs page?
            // For V1, let's just show a success message.
        } catch (error) {
            toast.dismiss();
            toast.error("Render Failed");
        }
    };

    if (!tutorial) return <div className="p-10 text-center">Loading Editor...</div>;

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            {/* Toolbar */}
            <div className="bg-white border-b px-6 py-3 flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/tutorial-studio')} className="text-gray-500 hover:text-gray-800"><FiArrowLeft /></button>
                    <div>
                        <h1 className="font-bold text-lg text-gray-800">{tutorial.title}</h1>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 rounded">
                            {tutorial.category} • {steps.length} Steps
                        </span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleRender} className="flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 font-medium shadow-sm transition">
                        <FiPlay /> Render Video
                    </button>
                    <button onClick={addStep} className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium">
                        <FiPlus /> Add Step
                    </button>
                    <button onClick={saveChanges} disabled={saving} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-medium shadow-sm transition">
                        <FiSave /> {saving ? 'Saving...' : 'Save Tutorial'}
                    </button>
                </div>
            </div>

            {/* Main Content: Timeline / Steps */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    {steps.map((step, index) => (
                        <div key={step.id || index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative group transition hover:shadow-md">
                            <div className="absolute top-4 left-4 bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center font-bold text-gray-500 text-sm">
                                {index + 1}
                            </div>
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition">
                                <button onClick={() => removeStep(index)} className="text-gray-400 hover:text-red-500"><FiTrash /></button>
                            </div>

                            <div className="ml-12 grid grid-cols-12 gap-6">
                                {/* Visual Preview / Upload */}
                                <div className="col-span-4">
                                    <div className="aspect-video bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 hover:border-indigo-300 transition flex flex-col items-center justify-center relative overflow-hidden">
                                        {step.media_path ? (
                                            <>
                                                <img src={`https://www.resortwala.com/storage/${step.media_path}`} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition">
                                                    <label className="cursor-pointer text-white font-medium hover:underline">
                                                        Change Image
                                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(index, e.target.files[0])} />
                                                    </label>
                                                </div>
                                            </>
                                        ) : (
                                            <label className="cursor-pointer flex flex-col items-center pt-2">
                                                <FiImage className="text-2xl text-gray-300 mb-2" />
                                                <span className="text-xs text-gray-500">Upload Screenshot</span>
                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(index, e.target.files[0])} />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                {/* Script & Config */}
                                <div className="col-span-8 space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Narration Script (TTS)</label>
                                        <textarea
                                            className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                            rows="3"
                                            placeholder="e.g., 'Click on the Save button to confirm your changes.'"
                                            value={step.script_content || ''}
                                            onChange={(e) => updateStep(index, 'script_content', e.target.value)}
                                        />
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Duration (s)</label>
                                            <input
                                                type="number"
                                                className="w-full border border-gray-200 rounded-lg p-2 text-sm"
                                                value={step.duration}
                                                onChange={(e) => updateStep(index, 'duration', parseFloat(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    <div
                        onClick={addStep}
                        className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50 transition cursor-pointer"
                    >
                        <FiPlus className="text-2xl mb-2" />
                        <span className="font-medium">Add Next Step</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
