import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import {
    FiPlus, FiEdit2, FiTrash2, FiEye, FiEyeOff, FiSearch,
    FiFilter, FiDownload, FiRefreshCw
} from 'react-icons/fi';

export default function BlogManager() {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: 'all',
        category: '',
        search: ''
    });
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0
    });

    useEffect(() => {
        fetchBlogs();
    }, [filters]);

    const fetchBlogs = async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page,
                limit: 20,
                ...(filters.status !== 'all' && { status: filters.status }),
                ...(filters.category && { category: filters.category }),
                ...(filters.search && { search: filters.search })
            });

            const res = await axios.get(`${API_BASE_URL}/admin/blogs?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setBlogs(res.data.data);
            setPagination({
                current_page: res.data.current_page,
                last_page: res.data.last_page,
                total: res.data.total
            });
        } catch (err) {
            console.error('Failed to fetch blogs:', err);
        } finally {
            setLoading(false);
        }
    };

    const togglePublish = async (id, currentStatus) => {
        try {
            await axios.post(`${API_BASE_URL}/admin/blogs/${id}/publish`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchBlogs(pagination.current_page);
        } catch (err) {
            console.error('Failed to toggle publish:', err);
        }
    };

    const deleteBlog = async (id) => {
        if (!confirm('Are you sure you want to delete this blog?')) return;

        try {
            await axios.delete(`${API_BASE_URL}/admin/blogs/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchBlogs(pagination.current_page);
        } catch (err) {
            console.error('Failed to delete blog:', err);
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Blog Manager</h1>
                    <p className="text-gray-600">Manage your blog posts and content</p>
                </div>
                <button
                    onClick={() => navigate('/content/blogs/new')}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    <FiPlus /> New Blog Post
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search blogs..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Status</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                    </select>

                    {/* Category Filter */}
                    <select
                        value={filters.category}
                        onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Categories</option>
                        <option value="travel">Travel</option>
                        <option value="destinations">Destinations</option>
                        <option value="tips">Tips & Guides</option>
                        <option value="events">Events</option>
                    </select>

                    {/* Refresh */}
                    <button
                        onClick={() => fetchBlogs(pagination.current_page)}
                        className="flex items-center justify-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
                    >
                        <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                </div>
            </div>

            {/* Blog List */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-500">Loading...</div>
                ) : blogs.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        No blogs found. Create your first blog post!
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Author</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Views</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {blogs.map((blog) => (
                                    <tr key={blog.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {blog.cover_image && (
                                                    <img
                                                        src={blog.cover_image}
                                                        alt={blog.title}
                                                        className="w-12 h-12 object-cover rounded"
                                                    />
                                                )}
                                                <div>
                                                    <div className="font-medium text-gray-900">{blog.title}</div>
                                                    <div className="text-sm text-gray-500">{blog.slug}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {blog.category || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {blog.author || 'ResortWala'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {blog.views_count || 0}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${blog.is_published
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {blog.is_published ? 'Published' : 'Draft'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {new Date(blog.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => togglePublish(blog.id, blog.is_published)}
                                                    className="p-2 text-gray-600 hover:text-blue-600 transition"
                                                    title={blog.is_published ? 'Unpublish' : 'Publish'}
                                                >
                                                    {blog.is_published ? <FiEyeOff /> : <FiEye />}
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/content/blogs/edit/${blog.id}`)}
                                                    className="p-2 text-gray-600 hover:text-blue-600 transition"
                                                    title="Edit"
                                                >
                                                    <FiEdit2 />
                                                </button>
                                                <button
                                                    onClick={() => deleteBlog(blog.id)}
                                                    className="p-2 text-gray-600 hover:text-red-600 transition"
                                                    title="Delete"
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {pagination.last_page > 1 && (
                    <div className="px-6 py-4 border-t flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            Showing {blogs.length} of {pagination.total} blogs
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => fetchBlogs(pagination.current_page - 1)}
                                disabled={pagination.current_page === 1}
                                className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <span className="px-4 py-2 text-gray-600">
                                Page {pagination.current_page} of {pagination.last_page}
                            </span>
                            <button
                                onClick={() => fetchBlogs(pagination.current_page + 1)}
                                disabled={pagination.current_page === pagination.last_page}
                                className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
