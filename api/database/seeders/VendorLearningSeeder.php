<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class VendorLearningSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Disable foreign key checks to allow truncation
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('learning_videos')->truncate();
        DB::table('page_walkthroughs')->truncate();
        DB::table('contextual_help_content')->truncate();
        // If walkthrough_steps exists, truncate it too, but we will try to use the JSON column as per migration
        // DB::table('walkthrough_steps')->truncate(); 
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // 1. Seed Learning Videos
        $videos = [
            [
                'title' => 'Welcome to ResortWala',
                'description' => 'A quick introduction to the vendor panel and how to get started.',
                'category' => 'getting_started',
                'video_url' => 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                'thumbnail_url' => null, // Removed external placeholder
                'duration_seconds' => 120,
                'difficulty_level' => 'beginner',
                'order' => 1
            ],
            [
                'title' => 'How to Add a Property',
                'description' => 'Step-by-step guide to listing your villa or resort.',
                'category' => 'listing_pricing',
                'video_url' => 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                'thumbnail_url' => null, // Removed external placeholder
                'duration_seconds' => 300,
                'difficulty_level' => 'intermediate',
                'order' => 2
            ],
            [
                'title' => 'Managing Availability',
                'description' => 'Learn how to block dates and manage your calendar.',
                'category' => 'availability_bookings',
                'video_url' => 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                'thumbnail_url' => null, // Removed external placeholder
                'duration_seconds' => 180,
                'difficulty_level' => 'beginner',
                'order' => 3
            ],
            [
                'title' => 'Understanding Pricing Rules',
                'description' => 'Maximize your revenue with dynamic pricing strategies.',
                'category' => 'listing_pricing',
                'video_url' => 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                'thumbnail_url' => null, // Removed external placeholder
                'duration_seconds' => 240,
                'difficulty_level' => 'advanced',
                'order' => 4
            ]
        ];

        foreach ($videos as $video) {
            // Remove extra keys not in DB if strictly checking, but array_merge handles it if loose.
            // Check migration again: difficulty_level is NOT in learning_videos schema in Step 2987.
            // So we should remove it to be safe.
            $insertData = [
                'title' => $video['title'],
                'slug' => Str::slug($video['title']),
                'description' => $video['description'],
                'category' => $video['category'],
                'video_url' => $video['video_url'],
                'thumbnail_url' => $video['thumbnail_url'],
                'duration_seconds' => $video['duration_seconds'],
                'difficulty_level' => $video['difficulty_level'],
                'display_order' => $video['order'],
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ];

            DB::table('learning_videos')->insert($insertData);
        }

        // 2. Seed Walkthroughs
        // Using JSON 'steps' column as per migration
        $steps = [
            [
                'element_selector' => '.sidebar-nav',
                'title' => 'Navigation Menu',
                'content' => 'Use the sidebar to access your properties, bookings, and calendar.',
                'position' => 1,
                'placement' => 'right'
            ],
            [
                'element_selector' => '.stats-card-bookings',
                'title' => 'Booking Stats',
                'content' => 'See your recent booking performance here.',
                'position' => 2,
                'placement' => 'bottom'
            ],
            [
                'element_selector' => '#ai-chat-trigger',
                'title' => 'AI Assistant',
                'content' => 'Need help? Click here to ask our AI assistant anything!',
                'position' => 3,
                'placement' => 'left'
            ]
        ];

        DB::table('page_walkthroughs')->updateOrInsert(
            ['page_route' => '/vendor/dashboard'],
            [
                'title' => 'Dashboard Tour',
                'description' => 'Get to know your main dashboard.',
                'page_name' => 'Dashboard',
                'steps' => json_encode($steps),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ]
        );

        // 3. Seed Contextual Help
        DB::table('contextual_help_content')->insert([
            'page_route' => '/vendor/properties/add',
            'element_id' => 'price_input',
            'title' => 'Base Price',
            'content' => 'Set your base nightly rate here. Weekend rates can be configured separately.',
            'help_type' => 'tooltip',
            'trigger' => 'hover',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $this->command->info('Vendor Learning System seeded successfully!');
    }
}
