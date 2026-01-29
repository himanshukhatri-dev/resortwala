import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { FiClock, FiUser, FiTag, FiEye, FiArrowLeft, FiShare2 } from 'react-icons/fi';
import { Helmet } from 'react-helmet-async';

export default function BlogPost() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [relatedBlogs, setRelatedBlogs] = useState([]);

    useEffect(() => {
        fetchBlog();
    }, [slug]);

    const fetchBlog = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/blogs/${slug}`);
            setBlog(res.data);

            // Fetch related blogs by category
            if (res.data.category) {
                const relatedRes = await axios.get(`${API_BASE_URL}/blogs?category=${res.data.category}&limit=3`);
                setRelatedBlogs(relatedRes.data.data.filter(b => b.slug !== slug));
            }
        } catch (err) {
            console.error('Failed to fetch blog:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: blog.title,
                text: blog.excerpt,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading blog...</p>
                </div>
            </div>
        );
    }

    if (!blog) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Blog Not Found</h1>
                    <p className="text-gray-600 mb-8">The blog post you're looking for doesn't exist.</p>
                    <button
                        onClick={() => navigate('/blog')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        Back to Blogs
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* SEO Meta Tags */}
            <Helmet>
                <title>{blog.meta_title || blog.title}</title>
                <meta name="description" content={blog.meta_description || blog.excerpt} />
                <meta property="og:title" content={blog.meta_title || blog.title} />
                <meta property="og:description" content={blog.meta_description || blog.excerpt} />
                {blog.cover_image && <meta property="og:image" content={blog.cover_image} />}
                <meta property="og:type" content="article" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={blog.meta_title || blog.title} />
                <meta name="twitter:description" content={blog.meta_description || blog.excerpt} />
                {blog.cover_image && <meta name="twitter:image" content={blog.cover_image} />}
                {blog.tags && <meta name="keywords" content={blog.tags.join(', ')} />}
            </Helmet>

            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white border-b sticky top-0 z-10">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <button
                            onClick={() => navigate('/blog')}
                            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition"
                        >
                            <FiArrowLeft />
                            <span>Back to Blogs</span>
                        </button>
                    </div>
                </div>

                {/* Cover Image */}
                {blog.cover_image && (
                    <div className="relative h-96 overflow-hidden">
                        <img
                            src={blog.cover_image}
                            alt={blog.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    </div>
                )}

                {/* Content */}
                <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {/* Category Badge */}
                    {blog.category && (
                        <span className="inline-block px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-full mb-4">
                            {blog.category}
                        </span>
                    )}

                    {/* Title */}
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                        {blog.title}
                    </h1>

                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-8 pb-8 border-b">
                        {blog.author && (
                            <div className="flex items-center gap-2">
                                <FiUser />
                                <span>{blog.author}</span>
                            </div>
                        )}
                        {blog.reading_time && (
                            <div className="flex items-center gap-2">
                                <FiClock />
                                <span>{blog.reading_time}</span>
                            </div>
                        )}
                        {blog.views_count !== undefined && (
                            <div className="flex items-center gap-2">
                                <FiEye />
                                <span>{blog.views_count} views</span>
                            </div>
                        )}
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-2 ml-auto text-blue-600 hover:text-blue-700 transition"
                        >
                            <FiShare2 />
                            <span>Share</span>
                        </button>
                    </div>

                    {/* Excerpt */}
                    {blog.excerpt && (
                        <div className="text-xl text-gray-700 mb-8 italic border-l-4 border-blue-600 pl-6 py-2">
                            {blog.excerpt}
                        </div>
                    )}

                    {/* Blog Content */}
                    <div
                        className="prose prose-lg max-w-none mb-12"
                        dangerouslySetInnerHTML={{ __html: blog.content }}
                        style={{
                            lineHeight: '1.8',
                            fontSize: '1.125rem'
                        }}
                    />

                    {/* Tags */}
                    {blog.tags && blog.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-12">
                            {blog.tags.map((tag, idx) => (
                                <span
                                    key={idx}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition cursor-pointer"
                                >
                                    <FiTag size={14} />
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Related Blogs */}
                    {relatedBlogs.length > 0 && (
                        <div className="mt-16 pt-12 border-t">
                            <h2 className="text-3xl font-bold text-gray-900 mb-8">Related Articles</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {relatedBlogs.map((relatedBlog) => (
                                    <article
                                        key={relatedBlog.id}
                                        onClick={() => navigate(`/blog/${relatedBlog.slug}`)}
                                        className="bg-white rounded-lg shadow-sm hover:shadow-md transition cursor-pointer overflow-hidden"
                                    >
                                        {relatedBlog.cover_image && (
                                            <img
                                                src={relatedBlog.cover_image}
                                                alt={relatedBlog.title}
                                                className="w-full h-40 object-cover"
                                            />
                                        )}
                                        <div className="p-4">
                                            <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">
                                                {relatedBlog.title}
                                            </h3>
                                            <p className="text-sm text-gray-600 line-clamp-2">
                                                {relatedBlog.excerpt}
                                            </p>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* CTA */}
                    <div className="mt-16 p-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-white text-center">
                        <h3 className="text-2xl font-bold mb-4">Ready to Book Your Dream Resort?</h3>
                        <p className="text-blue-100 mb-6">
                            Browse thousands of resorts and find your perfect getaway on ResortWala
                        </p>
                        <button
                            onClick={() => navigate('/properties')}
                            className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
                        >
                            Explore Resorts
                        </button>
                    </div>
                </article>
            </div>
        </>
    );
}
