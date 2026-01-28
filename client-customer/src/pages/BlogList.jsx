import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { FaCalendar, FaUser, FaArrowRight } from 'react-icons/fa';
import SEO from '../components/SEO';

const BlogList = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            // Using centralized config for API URL
            const { API_BASE_URL } = await import('../config');
            const { data } = await axios.get(`${API_BASE_URL}/blogs`);
            setPosts(data.data || []); // Handle paginated response
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch blogs", error);
            setLoading(false);
        }
    };

    return (
        <div className="bg-white min-h-screen pt-[100px] pb-12">
            <SEO
                title="Travel Guide & Tips | ResortWala Blog"
                description="Read our latest travel guides, tips, and resort reviews. Discover top destinations like Lonavala, Karjat, and Nashik."
                url={window.location.href}
                type="website"
            />

            <div className="container mx-auto px-4 max-w-7xl">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold font-serif text-gray-900 mb-4">The ResortWala Journal</h1>
                    <p className="text-gray-500 max-w-2xl mx-auto text-lg">
                        Expert guides, hidden gems, and travel tips to make your next getaway unforgettable.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF385C]"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map((post) => (
                            <Link to={`/blog/${post.slug}`} key={post.id} className="group flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                                <div className="relative h-60 overflow-hidden">
                                    <img
                                        src={post.cover_image || post.coverImage} // Fallback for transition
                                        alt={post.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    {post.category && (
                                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md shadow-sm">
                                            {post.category}
                                        </div>
                                    )}
                                </div>
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3 font-medium">
                                        <span className="flex items-center gap-1.5"><FaCalendar className="text-[#FF385C]" /> {post.published_at ? format(new Date(post.published_at), 'MMM dd, yyyy') : 'Recently'}</span>
                                        <span className="flex items-center gap-1.5"><FaUser className="text-[#FF385C]" /> {post.author}</span>
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-3 leading-tight group-hover:text-[#FF385C] transition-colors font-serif">
                                        {post.title}
                                    </h2>
                                    <p className="text-gray-600 text-sm line-clamp-3 mb-6 flex-1">
                                        {post.excerpt}
                                    </p>
                                    <div className="flex items-center text-[#FF385C] font-bold text-sm uppercase tracking-wider gap-2 group-hover:gap-3 transition-all">
                                        Read Article <FaArrowRight size={12} />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlogList;
