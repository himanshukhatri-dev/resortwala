import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Home from './Home';
import { useSearch } from '../context/SearchContext';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import SEO from '../components/SEO';

const CategoryLanding = ({ type }) => {
    const { city } = useParams();
    const { setLocation, setActiveCategory } = useSearch();
    const [seoData, setSeoData] = useState(null);

    const slug = `${type === 'waterpark' ? 'waterparks-near' : type === 'villas' ? 'villas-near' : 'resorts-in'}/${city}`;

    useEffect(() => {
        // 1. Force context update to pre-filter results
        if (city) {
            setLocation(city.charAt(0).toUpperCase() + city.slice(1));
        }
        setActiveCategory(type);

        // 2. Fetch specialized SEO metadata for this intent
        const fetchSEO = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/admin/intelligence/seo?slug=${slug}`);
                if (response.data) {
                    setSeoData(response.data);
                }
            } catch (error) {
                console.error("SEO Metadata fetch failed", error);
            }
        };
        fetchSEO();
    }, [city, type, slug]);

    return (
        <>
            {seoData && (
                <SEO
                    title={seoData.title}
                    description={seoData.description}
                    keywords={seoData.keywords}
                />
            )}
            <Home landingMode={true} landingSeo={seoData} />
        </>
    );
};

export default CategoryLanding;
