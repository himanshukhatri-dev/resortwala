<?php

namespace App\Traits;

use App\Models\SEOConfig;
use Illuminate\Support\Facades\Cache;

trait SEOManager
{
    /**
     * Get SEO metadata for a specific slug or page type.
     */
    public function getSEOMetadata($slug = null, $pageType = null)
    {
        return Cache::remember("seo_meta_{$slug}_{$pageType}", 1440, function () use ($slug, $pageType) {
            $query = SEOConfig::where('is_active', true);

            if ($slug) {
                $query->where('slug', $slug);
            } elseif ($pageType) {
                $query->where('page_type', $pageType);
            }

            $config = $query->first();

            if (!$config) {
                return $this->getDefaultMetadata();
            }

            return [
                'title' => $config->meta_title,
                'description' => $config->meta_description,
                'keywords' => $config->meta_keywords,
                'h1' => $config->h1_title,
                'about' => $config->about_content,
                'faqs' => $config->faqs,
                'schema' => $this->generateSchema($config)
            ];
        });
    }

    /**
     * Generate JSON-LD schema based on config.
     */
    private function generateSchema($config)
    {
        $schemas = [];

        // FAQ Schema
        if ($config->faqs && is_array($config->faqs)) {
            $schemas[] = [
                "@context" => "https://schema.org",
                "@type" => "FAQPage",
                "mainEntity" => array_map(function ($faq) {
                    return [
                        "@type" => "Question",
                        "name" => $faq['question'] ?? $faq['q'] ?? '',
                        "acceptedAnswer" => [
                            "@type" => "Answer",
                            "text" => $faq['answer'] ?? $faq['a'] ?? ''
                        ]
                    ];
                }, $config->faqs)
            ];
        }

        // Add more dynamic schemas if needed (LocalBusiness, etc.)

        return $schemas;
    }

    private function getDefaultMetadata()
    {
        return [
            'title' => 'ResortWala - Luxury Stays & Waterparks',
            'description' => 'Book the best villas, resorts, and waterparks near you.',
            'keywords' => 'resorts, villas, waterparks',
            'h1' => null,
            'about' => null,
            'faqs' => [],
            'schema' => []
        ];
    }
}
