import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({
    title,
    description = "Book luxury resorts, villas, and stays with ResortWala. Experience the best hospitality.",
    keywords = "resort, booking, lonavala, villa, stay, hotel, resortwala",
    image = "https://resortwala.com/resortwala-logo.png",
    url = "https://resortwala.com",
    type = "website",
    schema = null
}) => {
    const siteTitle = title ? `${title} | ResortWala` : "ResortWala - Luxury Stays & Villas";
    const currentUrl = url || window.location.href;

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{siteTitle}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />
            <link rel="canonical" href={currentUrl} />

            {/* Open Graph / Facebook / WhatsApp */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={currentUrl} />
            <meta property="og:title" content={siteTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            <meta property="og:site_name" content="ResortWala" />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={currentUrl} />
            <meta property="twitter:title" content={siteTitle} />
            <meta property="twitter:description" content={description} />
            <meta property="twitter:image" content={image} />

            {/* JSON-LD Schema */}
            {schema && (
                <script type="application/ld+json">
                    {JSON.stringify(schema)}
                </script>
            )}
        </Helmet>
    );
};

export default SEO;
