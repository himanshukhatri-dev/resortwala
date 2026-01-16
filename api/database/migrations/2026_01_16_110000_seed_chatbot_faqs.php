<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $faqs = [
            [
                'question' => 'How do I list my property?',
                'answer' => "It's simple! You can list your property by clicking the 'List Property' button for Vendors. We'll ask for some basic details and photos.",
                'action_type' => 'link',
                'action_payload' => json_encode(['url' => 'https://resortwala.com/signup']), // Assuming signup link
                'priority' => 100,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'question' => 'How does ResortWala work?',
                'answer' => "We bridge the gap between Villa Owners and Guests. Hosts get verified bookings, and Guests get premium stays with zero booking fees.",
                'action_type' => 'none',
                'action_payload' => null,
                'priority' => 90,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'question' => 'What are the charges?',
                'answer' => "Listing is free! We operate on a customized commission model for confirmed bookings only. No upfront costs.",
                'action_type' => 'none',
                'action_payload' => null,
                'priority' => 80,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'question' => 'Talk to Support',
                'answer' => "Sure! You can chat with our support team directly on WhatsApp.",
                'action_type' => 'whatsapp',
                'action_payload' => json_encode(['url' => 'https://wa.me/919999999999']), // Verify number
                'priority' => 10,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ];

        DB::table('chatbot_faqs')->insert($faqs);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Don't delete, as user might have edited them.
    }
};
