import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { FiPlus, FiVideo, FiEdit, FiTrash2, FiPlay, FiSearch } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function TutorialStudio() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [tutorials, setTutorials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newTitle, setNewTitle] = useState('');

    useEffect(() => {
        fetchTutorials();
    }, []);

    const fetchTutorials = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/tutorials`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTutorials(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load tutorials");
        }
        setLoading(false);
    };

    const handleCreate = async () => {
        if (!newTitle.trim()) return;
        try {
            const res = await axios.post(`${API_BASE_URL}/admin/tutorials`, {
                title: newTitle,
                category: 'Onboarding',
                target_role: 'Vendor'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Tutorial created!");
            setIsCreating(false);
            setNewTitle('');
            fetchTutorials();
            navigate(`/tutorial-studio/${res.data.id}`);
        } catch (error) {
            toast.error("Failed to create tutorial");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure? This will delete all steps too.")) return;
        try {
            await axios.delete(`${API_BASE_URL}/admin/tutorials/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Deleted");
            fetchTutorials();
        } catch (error) {
            toast.error("Failed to delete");
        }
    };

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <span className="bg-indigo-100 p-2 rounded-lg text-indigo-600"><FiVideo /></span>
                        Video Tutorial Studio
                    </h1>
                    <p className="text-gray-500 mt-1">Create AI-narrated walkthroughs for your vendors.</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm transition"
                >
                    <FiPlus /> New Tutorial
                </button>
            </div>

            {isCreating && (
                <div className="bg-white p-6 rounded-xl shadow-lg border border-indigo-100 mb-8 animate-fade-in">
                    <h3 className="font-bold text-lg mb-4">Start a New Tutorial</h3>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            placeholder="e.g., How to Add a Property"
                            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={newTitle}
                            onChange={e => setNewTitle(e.target.value)}
                            autoFocus
                        />
                        <button onClick={handleCreate} className="bg-indigo-600 text-white px-6 rounded-lg font-medium">Create</button>
                        <button onClick={() => setIsCreating(false)} className="text-gray-500 px-4">Cancel</button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="text-center py-20 text-gray-400">Loading Studio...</div>
            ) : tutorials.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                    <div className="mx-auto bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center text-gray-400 mb-4 text-2xl"><FiVideo /></div>
                    <h3 className="text-xl font-bold text-gray-700">No Tutorials Yet</h3>
                    <p className="text-gray-500 mb-6">Create your first video guide to help vendors.</p>
                    <button onClick={() => setIsCreating(true)} className="text-indigo-600 font-medium hover:underline">Get Started</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tutorials.map(t => (
                        <div key={t.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition group overflow-hidden">
                            <div className="h-40 bg-gray-100 relative items-center justify-center flex">
                                {t.thumbnail_path ? (
                                    <img src={t.thumbnail_path} className="w-full h-full object-cover" />
                                ) : (
                                    <FiPlay className="text-4xl text-gray-300" />
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-4">
                                    <button onClick={() => navigate(`/tutorial-studio/${t.id}`)} className="bg-white text-indigo-600 p-3 rounded-full hover:scale-110 transition"><FiEdit /></button>
                                </div>
                                <span className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold ${t.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                                    {t.is_published ? 'Published' : 'Draft'}
                                </span>
                            </div>
                            <div className="p-5">
                                <h3 className="font-bold text-gray-800 text-lg mb-1">{t.title}</h3>
                                <div className="flex justify-between items-center text-sm text-gray-500">
                                    <span>{t.steps_count || 0} Steps</span>
                                    <span>{t.duration_seconds}s</span>
                                </div>
                                <div className="mt-4 flex justify-between border-t border-gray-100 pt-4">
                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 uppercase font-medium">{t.target_role}</span>
                                    <button onClick={() => handleDelete(t.id)} className="text-red-400 hover:text-red-600"><FiTrash2 /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Recent Renders Section */}
            <div className="mt-12 border-t pt-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Recent Renders</h2>
                    <button onClick={() => window.location.reload()} className="text-indigo-600 text-sm hover:underline flex items-center gap-1"><FiSearch /> Refresh Status</button>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-3">Tutorial</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Queued At</th>
                                <th className="px-6 py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            <RenderList />
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function RenderList() {
    const [jobs, setJobs] = useState([]);
    const { token } = useAuth();

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/admin/tutorials/jobs/recent`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setJobs(res.data);
            } catch (err) {
                console.error("Failed to fetch jobs");
            }
        };
        fetchJobs();
        const interval = setInterval(fetchJobs, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    if (jobs.length === 0) return <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-400">No recent renders found.</td></tr>;

    return jobs.map(job => (
        <tr key={job.id} className="hover:bg-gray-50 transition">
            <td className="px-6 py-4 font-medium text-gray-800">
                {job.options?.title || 'Unknown Title'}
            </td>
            <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${job.status === 'completed' ? 'bg-green-100 text-green-700' :
                        job.status === 'failed' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                    }`}>
                    {job.status}
                </span>
                {job.status === 'failed' && <div className="text-xs text-red-500 mt-1 max-w-xs truncate">{job.error_message}</div>}
            </td>
            <td className="px-6 py-4 text-gray-500">
                {new Date(job.created_at).toLocaleString()}
            </td>
            <td className="px-6 py-4">
                {job.status === 'completed' && job.output_path && (
                    <a
                        href={`${API_BASE_URL.replace('/api', '')}/storage/${job.output_path}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                    >
                        <FiPlay /> Watch
                    </a>
                )}
            </td>
        </tr>
    ));
}
