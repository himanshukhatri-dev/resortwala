import { Helmet } from 'react-helmet-async';

const SEO = ({ title, description, keywords, image, url }) => {
    const siteTitle = 'ResortWala - Luxury Stays & Waterparks';
    const siteUrl = 'https://resortwala.com';
    const defaultImage = `${siteUrl}/resortwala-logo.png`;

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{title ? `${title} | ResortWala` : siteTitle}</title>
            <meta name="description" content={description || "Compare and book the best resorts, waterparks, and villas near you with ResortWala. Exclusive deals and lowest prices guaranteed."} />
            <meta name="keywords" content={keywords || "resorts, waterparks, villas, staycation, weekend gateways, luxury stays, resort booking"} />
            <link rel="canonical" href={url ? `${siteUrl}${url}` : siteUrl} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content="website" />
            <meta property="og:url" content={url ? `${siteUrl}${url}` : siteUrl} />
            <meta property="og:title" content={title || siteTitle} />
            <meta property="og:description" content={description || "Book your perfect getaway with ResortWala."} />
            <meta property="og:image" content={image || defaultImage} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={url ? `${siteUrl}${url}` : siteUrl} />
            <meta name="twitter:title" content={title || siteTitle} />
            <meta name="twitter:description" content={description || "Book your perfect getaway with ResortWala."} />
            <meta name="twitter:image" content={image || defaultImage} />
        </Helmet>
    );
};

export default SEO;
