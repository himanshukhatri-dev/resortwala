import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { FiSearch, FiClock, FiUser, FiTag, FiArrowRight } from 'react-icons/fi';

export default function BlogList() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [category, setCategory] = useState(searchParams.get('category') || '');
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0
    });

    useEffect(() => {
        fetchBlogs();
    }, [searchParams]);

    const fetchBlogs = async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page,
                limit: 12,
                ...(search && { search }),
                ...(category && { category })
            });

            const res = await axios.get(`${API_BASE_URL}/blogs?${params}`);
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

    const handleSearch = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (category) params.set('category', category);
        setSearchParams(params);
    };

    const handleCategoryClick = (cat) => {
        setCategory(cat);
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (cat) params.set('category', cat);
        setSearchParams(params);
    };

    const categories = ['Travel', 'Destinations', 'Tips', 'Events', 'Honeymoon', 'Family Travel'];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-5xl font-bold mb-4">ResortWala Blog</h1>
                    <p className="text-xl text-blue-100 mb-8">
                        Discover amazing destinations, travel tips, and resort guides
                    </p>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="max-w-2xl">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search blogs..."
                                    className="w-full pl-12 pr-4 py-3 rounded-lg text-gray-900 focus:ring-2 focus:ring-white"
                                />
                            </div>
                            <button
                                type="submit"
                                className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
                            >
                                Search
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Categories */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex gap-2 overflow-x-auto">
                        <button
                            onClick={() => handleCategoryClick('')}
                            className={`px-4 py-2 rounded-full whitespace-nowrap transition ${category === ''
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            All Posts
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => handleCategoryClick(cat.toLowerCase())}
                                className={`px-4 py-2 rounded-full whitespace-nowrap transition ${category === cat.toLowerCase()
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Blog Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {loading ? (
                    <div className="text-center py-20">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="mt-4 text-gray-600">Loading blogs...</p>
                    </div>
                ) : blogs.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-xl text-gray-600">No blogs found. Try a different search or category.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {blogs.map((blog) => (
                                <article
                                    key={blog.id}
                                    onClick={() => navigate(`/blog/${blog.slug}`)}
                                    className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group"
                                >
                                    {/* Cover Image */}
                                    {blog.cover_image && (
                                        <div className="relative h-48 overflow-hidden">
                                            <img
                                                src={blog.cover_image}
                                                alt={blog.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                            />
                                            {blog.category && (
                                                <span className="absolute top-4 right-4 px-3 py-1 bg-blue-600 text-white text-sm font-semibold rounded-full">
                                                    {blog.category}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div className="p-6">
                                        <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition line-clamp-2">
                                            {blog.title}
                                        </h2>

                                        <p className="text-gray-600 mb-4 line-clamp-3">
                                            {blog.excerpt}
                                        </p>

                                        {/* Meta Info */}
                                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                                            {blog.author && (
                                                <div className="flex items-center gap-1">
                                                    <FiUser size={14} />
                                                    <span>{blog.author}</span>
                                                </div>
                                            )}
                                            {blog.reading_time && (
                                                <div className="flex items-center gap-1">
                                                    <FiClock size={14} />
                                                    <span>{blog.reading_time}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Tags */}
                                        {blog.tags && blog.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {blog.tags.slice(0, 3).map((tag, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                                                    >
                                                        <FiTag size={10} />
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Read More */}
                                        <div className="flex items-center gap-2 text-blue-600 font-semibold group-hover:gap-3 transition-all">
                                            <span>Read More</span>
                                            <FiArrowRight />
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination.last_page > 1 && (
                            <div className="mt-12 flex items-center justify-center gap-2">
                                <button
                                    onClick={() => fetchBlogs(pagination.current_page - 1)}
                                    disabled={pagination.current_page === 1}
                                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>

                                <div className="flex gap-2">
                                    {[...Array(pagination.last_page)].map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => fetchBlogs(idx + 1)}
                                            className={`px-4 py-2 rounded-lg ${pagination.current_page === idx + 1
                                                    ? 'bg-blue-600 text-white'
                                                    : 'border hover:bg-gray-50'
                                                }`}
                                        >
                                            {idx + 1}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => fetchBlogs(pagination.current_page + 1)}
                                    disabled={pagination.current_page === pagination.last_page}
                                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
