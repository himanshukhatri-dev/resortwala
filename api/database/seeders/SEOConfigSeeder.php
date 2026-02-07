<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SEOConfigSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \App\Models\SEOConfig::create([
            'page_type' => 'category_landing',
            'slug' => 'waterparks-near-mumbai',
            'target_city' => 'mumbai',
            'target_category' => 'waterpark',
            'meta_title' => 'Best Waterparks near Mumbai (2025) | ResortWala',
            'meta_description' => 'Compare the best waterparks near Mumbai. Get exclusive discounts, verified photos, and easy booking for a fun weekend gateway.',
            'meta_keywords' => 'waterpark near mumbai, cheap waterpark mumbai, weekend gateway mumbai',
            'h1_title' => 'Explore the Best Waterparks near Mumbai',
            'about_content' => '<p>Mumbai heat is best escaped at one of the many state-of-the-art waterparks within a 2-hour drive.</p>',
            'faqs' => [
                ['q' => 'Which is the best waterpark near Mumbai?', 'a' => 'Popular choices include Wet N Joy and Great Escape.'],
                ['q' => 'Are there any cheap waterparks?', 'a' => 'Yes, several waterparks offer entry under ₹1000.']
            ]
        ]);

        \App\Models\SEOConfig::create([
            'page_type' => 'city_landing',
            'slug' => 'villas-in-lonavala',
            'target_city' => 'lonavala',
            'target_category' => 'villa',
            'meta_title' => 'Luxury Private Pool Villas in Lonavala | ResortWala',
            'meta_description' => 'Book premium villas in Lonavala with private pools. Perfect for groups, families, and couples. Verified properties, best rates.',
            'meta_keywords' => 'villas in lonavala, private pool villa lonavala, lonavala stay',
            'h1_title' => 'Luxury Villas in Lonavala with Private Pools',
            'about_content' => '<p>Escape the hustle of the city and find comfort in the misty hills of Lonavala.</p>',
            'faqs' => [
                ['q' => 'What is the average price for a villa in Lonavala?', 'a' => 'Villas start from ₹8,000 to ₹50,000 depending on luxury level.']
            ]
        ]);
    }
}
