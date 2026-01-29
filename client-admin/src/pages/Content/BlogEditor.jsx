import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { FiSave, FiEye, FiArrowLeft, FiImage } from 'react-icons/fi';

export default function BlogEditor() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [blog, setBlog] = useState({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        cover_image: '',
        author: 'ResortWala',
        category: '',
        tags: [],
        meta_title: '',
        meta_description: '',
        is_published: false
    });

    useEffect(() => {
        if (id) {
            fetchBlog();
        }
    }, [id]);

    const fetchBlog = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/blogs/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBlog(res.data);
        } catch (err) {
            console.error('Failed to fetch blog:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setBlog({ ...blog, [field]: value });

        // Auto-generate slug from title
        if (field === 'title' && !id) {
            const slug = value
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
            setBlog(prev => ({ ...prev, slug }));
        }
    };

    const handleSave = async (publish = false) => {
        setSaving(true);
        try {
            const payload = { ...blog, is_published: publish };

            if (id) {
                await axios.put(`${API_BASE_URL}/admin/blogs/${id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post(`${API_BASE_URL}/admin/blogs`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            navigate('/content/blogs');
        } catch (err) {
            console.error('Failed to save blog:', err);
            alert('Failed to save blog. Please check all fields.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-6 text-center">Loading...</div>;
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/content/blogs')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        <FiArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            {id ? 'Edit Blog Post' : 'New Blog Post'}
                        </h1>
                        <p className="text-gray-600">Create engaging content for your audience</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleSave(false)}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                    >
                        <FiSave /> Save Draft
                    </button>
                    <button
                        onClick={() => handleSave(true)}
                        disabled={saving}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    >
                        <FiEye /> Publish
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="col-span-2 space-y-6">
                    {/* Title */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Title *
                        </label>
                        <input
                            type="text"
                            value={blog.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            placeholder="Enter blog title..."
                            className="w-full px-4 py-3 text-2xl font-bold border-0 focus:ring-0 focus:outline-none"
                        />
                    </div>

                    {/* Slug */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            URL Slug
                        </label>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500">/blog/</span>
                            <input
                                type="text"
                                value={blog.slug}
                                onChange={(e) => handleChange('slug', e.target.value)}
                                placeholder="url-friendly-slug"
                                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Excerpt */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Excerpt
                        </label>
                        <textarea
                            value={blog.excerpt}
                            onChange={(e) => handleChange('excerpt', e.target.value)}
                            placeholder="Brief summary of the blog post..."
                            rows={3}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Content */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Content *
                        </label>
                        <textarea
                            value={blog.content}
                            onChange={(e) => handleChange('content', e.target.value)}
                            placeholder="Write your blog content here... (HTML supported)"
                            rows={20}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        />
                        <p className="mt-2 text-xs text-gray-500">
                            Tip: You can use HTML tags for formatting
                        </p>
                    </div>

                    {/* SEO Section */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-semibold mb-4">SEO Metadata</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Meta Title ({blog.meta_title.length}/60)
                                </label>
                                <input
                                    type="text"
                                    value={blog.meta_title}
                                    onChange={(e) => handleChange('meta_title', e.target.value)}
                                    maxLength={60}
                                    placeholder="SEO-optimized title..."
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Meta Description ({blog.meta_description.length}/160)
                                </label>
                                <textarea
                                    value={blog.meta_description}
                                    onChange={(e) => handleChange('meta_description', e.target.value)}
                                    maxLength={160}
                                    placeholder="SEO-optimized description..."
                                    rows={3}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Cover Image */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cover Image
                        </label>
                        {blog.cover_image ? (
                            <div className="relative">
                                <img
                                    src={blog.cover_image}
                                    alt="Cover"
                                    className="w-full h-48 object-cover rounded-lg"
                                />
                                <button
                                    onClick={() => handleChange('cover_image', '')}
                                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-lg hover:bg-red-600"
                                >
                                    Remove
                                </button>
                            </div>
                        ) : (
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                <FiImage className="mx-auto text-gray-400 mb-2" size={32} />
                                <input
                                    type="text"
                                    value={blog.cover_image}
                                    onChange={(e) => handleChange('cover_image', e.target.value)}
                                    placeholder="Enter image URL..."
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 mt-2"
                                />
                            </div>
                        )}
                    </div>

                    {/* Category */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Category
                        </label>
                        <select
                            value={blog.category}
                            onChange={(e) => handleChange('category', e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select category</option>
                            <option value="travel">Travel</option>
                            <option value="destinations">Destinations</option>
                            <option value="tips">Tips & Guides</option>
                            <option value="events">Events</option>
                        </select>
                    </div>

                    {/* Author */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Author
                        </label>
                        <input
                            type="text"
                            value={blog.author}
                            onChange={(e) => handleChange('author', e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Tags */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tags (comma-separated)
                        </label>
                        <input
                            type="text"
                            value={blog.tags.join(', ')}
                            onChange={(e) => handleChange('tags', e.target.value.split(',').map(t => t.trim()))}
                            placeholder="travel, resort, vacation"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
