import React from 'react';
import { motion } from 'framer-motion';
import { FaChevronDown, FaChevronUp, FaMapMarkerAlt, FaQuestionCircle } from 'react-icons/fa';
import { Disclosure } from '@headlessui/react';

const LocationRichContent = ({ locationKey, dynamicContent = null }) => {
    // Dynamic import to avoid hydration mismatches if data is missing
    const [content, setContent] = React.useState(null);

    React.useEffect(() => {
        if (dynamicContent) {
            setContent({
                aboutTitle: dynamicContent.h1,
                aboutContent: dynamicContent.about,
                faqs: dynamicContent.faqs?.map(f => ({
                    question: f.q || f.question,
                    answer: f.a || f.answer
                }))
            });
        } else {
            import('../../data/locationData').then(module => {
                const data = module.LOCATION_CONTENT[locationKey?.toLowerCase()];
                if (data) setContent(data);
            });
        }
    }, [locationKey, dynamicContent]);

    if (!content) return null;

    return (
        <section className="py-12 bg-gray-50 border-t border-gray-100 mt-8">
            <div className="container mx-auto px-4 max-w-7xl">

                {/* 1. About Section */}
                <div className="mb-12">
                    <div className="flex items-center gap-2 mb-4">
                        <FaMapMarkerAlt className="text-[#FF385C] text-xl" />
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-serif">
                            {content.aboutTitle || `About ${locationKey}`}
                        </h2>
                    </div>
                    <div
                        className="prose prose-lg text-gray-600 max-w-4xl"
                        dangerouslySetInnerHTML={{ __html: content.aboutContent }}
                    />
                </div>

                {/* 2. FAQ Section */}
                {content.faqs && content.faqs.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <FaQuestionCircle className="text-blue-600 text-xl" />
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-serif">
                                Frequently Asked Questions
                            </h2>
                        </div>

                        <div className="grid gap-4 max-w-4xl">
                            {content.faqs.map((faq, idx) => (
                                <Disclosure key={idx} as="div" className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                    {({ open }) => (
                                        <>
                                            <Disclosure.Button className="flex w-full justify-between items-center px-6 py-4 text-left text-sm font-medium text-gray-900 hover:bg-gray-50 transition focus:outline-none">
                                                <span className="text-base font-bold">{faq.question}</span>
                                                {open ? <FaChevronUp className="text-gray-400" /> : <FaChevronDown className="text-gray-400" />}
                                            </Disclosure.Button>
                                            <Disclosure.Panel className="px-6 pb-4 pt-0 text-gray-600 leading-relaxed">
                                                {faq.answer}
                                            </Disclosure.Panel>
                                        </>
                                    )}
                                </Disclosure>
                            ))}
                        </div>

                        {/* SEO Schema Injection */}
                        <script type="application/ld+json">
                            {JSON.stringify({
                                "@context": "https://schema.org",
                                "@type": "FAQPage",
                                "mainEntity": content.faqs.map(faq => ({
                                    "@type": "Question",
                                    "name": faq.question,
                                    "acceptedAnswer": {
                                        "@type": "Answer",
                                        "text": faq.answer
                                    }
                                }))
                            })}
                        </script>
                    </div>
                )}
            </div>
        </section>
    );
};

export default LocationRichContent;
