import React, { useEffect, useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { FaCalendar, FaUser, FaTag, FaArrowLeft, FaFacebook, FaTwitter, FaWhatsapp } from 'react-icons/fa';
import SEO from '../components/SEO';

const BlogPost = () => {
    const { slug } = useParams();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchPost();
    }, [slug]);

    const fetchPost = async () => {
        try {
            setLoading(true);
            const { API_BASE_URL } = await import('../config');
            const { data } = await axios.get(`${API_BASE_URL}/blogs/${slug}`);
            setPost(data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch blog post", error);
            setError(true);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen pt-[100px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF385C]"></div>
            </div>
        );
    }

    if (error || !post) {
        return <Navigate to="/blog" replace />;
    }

    const shareUrl = window.location.href;

    // Schema for BlogPosting
    const blogSchema = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": post.title,
        "image": post.cover_image,
        "author": {
            "@type": "Person",
            "name": post.author
        },
        "publisher": {
            "@type": "Organization",
            "name": "ResortWala",
            "logo": {
                "@type": "ImageObject",
                "url": "https://resortwala.com/logo.png"
            }
        },
        "datePublished": post.published_at,
        "description": post.excerpt
    };

    return (
        <div className="bg-white min-h-screen pt-[100px] pb-20">
            <SEO
                title={`${post.title} | ResortWala Blog`}
                description={post.excerpt}
                image={post.cover_image}
                url={shareUrl}
                type="article"
                schema={blogSchema}
            />

            <article className="container mx-auto px-4 max-w-4xl">
                {/* Header */}
                <div className="mb-8 text-center">
                    <Link to="/blog" className="inline-flex items-center gap-2 text-gray-500 hover:text-black mb-6 font-bold text-sm uppercase tracking-wide transition">
                        <FaArrowLeft /> Back to Journal
                    </Link>
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-600 uppercase tracking-wider">{post.category}</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-bold font-serif text-gray-900 mb-6 leading-tight">
                        {post.title}
                    </h1>
                    <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500 font-medium">
                        <span className="flex items-center gap-2"><FaUser className="text-gray-400" /> {post.author}</span>
                        <span className="flex items-center gap-2"><FaCalendar className="text-gray-400" /> {post.published_at ? format(new Date(post.published_at), 'MMMM dd, yyyy') : 'Recent'}</span>
                    </div>
                </div>

                {/* Cover Image */}
                <div className="rounded-3xl overflow-hidden shadow-2xl mb-12 aspect-video relative">
                    <img src={post.cover_image || post.coverImage} alt={post.title} className="w-full h-full object-cover" />
                </div>

                {/* Content */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Share Sidebar */}
                    <div className="lg:col-span-1 hidden lg:flex flex-col gap-4 sticky top-32 h-fit">
                        <span className="text-xs font-bold text-gray-400 uppercase rotate-180 mb-4 writing-vertical">Share</span>
                        <a href={`https://wa.me/?text=${encodeURIComponent(post.title + ' ' + shareUrl)}`} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-600 hover:text-white transition shadow-sm border border-green-100"><FaWhatsapp /></a>
                        <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-blue-50 text-blue-400 flex items-center justify-center hover:bg-blue-400 hover:text-white transition shadow-sm border border-blue-100"><FaTwitter /></a>
                        <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center hover:bg-blue-700 hover:text-white transition shadow-sm border border-blue-100"><FaFacebook /></a>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-10 lg:col-start-2">
                        <div
                            className="prose prose-lg prose-headings:font-serif prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-600 prose-a:text-[#FF385C] prose-img:rounded-xl max-w-none"
                            dangerouslySetInnerHTML={{ __html: post.content }}
                        />

                        {/* Tags */}
                        {post.tags && (
                            <div className="mt-12 pt-8 border-t border-gray-100">
                                <h4 className="flex items-center gap-2 font-bold text-gray-900 mb-4"><FaTag className="text-gray-400" /> Tags</h4>
                                <div className="flex flex-wrap gap-2">
                                    {post.tags.map(tag => (
                                        <span key={tag} className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 text-sm rounded-lg cursor-pointer transition">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </article>
        </div>
    );
};

export default BlogPost;
