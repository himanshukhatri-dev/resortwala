<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LearningSeeder extends Seeder
{
    public function run()
    {
        // Clear existing data
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('learning_steps')->truncate();
        DB::table('learning_modules')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // 1. Create Module: Create Listing
        $moduleId = DB::table('learning_modules')->insertGetId([
            'slug' => 'create-first-listing',
            'title' => 'Create Your First Listing',
            'description' => 'Learn how to add a new property, set pricing, and upload photos.',
            'category' => 'onboarding',
            'difficulty' => 'beginner',
            'duration_seconds' => 120,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 2. Add Steps
        $steps = [
            [
                'step_order' => 1,
                'title' => 'Navigation',
                'action_type' => 'navigate',
                'path' => '/properties',
                'narration_text' => 'We are heading to the Properties section. This is your command center for managing all your resort units and listings.',
            ],
            [
                'step_order' => 2,
                'title' => 'The Goal',
                'action_type' => 'highlight',
                'selector' => '[data-testid="btn-add-property"]',
                'payload' => json_encode(['position' => 'bottom']),
                'narration_text' => 'The "Add Resort" button is where the magic happens. Clicking this will open the listing wizard.',
            ],
            [
                'step_order' => 3,
                'title' => 'Taking Action',
                'action_type' => 'click',
                'selector' => '[data-testid="btn-add-property"]',
                'narration_text' => 'Go ahead and click it! Don\'t worry, you can always save as a draft later.',
            ],
            [
                'step_order' => 4,
                'title' => 'Form Ready',
                'action_type' => 'wait',
                'payload' => json_encode(['ms' => 1000]),
                'narration_text' => 'Perfect. The creation form is divided into simple sections: Basic Info, Location, and Pricing.',
            ],
            [
                'step_order' => 5,
                'title' => 'Naming your Gem',
                'action_type' => 'highlight',
                'selector' => 'input[name="title"]',
                'narration_text' => 'Start with a name that stands out. Guests love descriptive titles like "Sunrise Luxury Villa" or "Poolside Garden Suite".',
            ],
            [
                'step_order' => 6,
                'title' => 'Your Identity',
                'action_type' => 'input',
                'selector' => 'input[name="title"]',
                'payload' => json_encode(['text' => 'Dream Resort Suite']),
                'narration_text' => 'Type in your resort name. Once you enter at least 3 characters, we\'ll move to the next detail.',
            ],
        ];

        foreach ($steps as $step) {
            DB::table('learning_steps')->insert(array_merge($step, [
                'module_id' => $moduleId,
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }

        echo "LearningSeeder: Seeded 'Create Your First Listing' with " . count($steps) . " steps.\n";
    }
}
