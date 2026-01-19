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
            // --- Amenities & Facilities ---
            [
                'question' => 'What basic amenities are included?',
                'answer' => "Our premium villas include air conditioning (AC), high-speed WiFi, 24/7 caretaker service, private parking, and power backup. Most kitchens are fully equipped with refrigerators and microwave ovens.",
                'category' => 'amenities',
                'keywords' => json_encode(['amenities', 'facility', 'ac', 'wifi', 'parking', 'caretaker', 'power', 'battery', 'fridge']),
                'priority' => 88,
                'created_at' => now(), 'updated_at' => now()
            ],
            [
                'question' => 'Is there a caretaker on site?',
                'answer' => "Yes, all our villas come with a dedicated caretaker to assist with check-in, housekeeping, and general needs. Some caretakers can also help with basic cooking for a small additional fee.",
                'category' => 'amenities',
                'keywords' => json_encode(['caretaker', 'staff', 'help', 'service', 'housekeeping']),
                'priority' => 85,
                'created_at' => now(), 'updated_at' => now()
            ],

            // --- Detailed Food Options ---
            [
                'question' => 'What are the food charges?',
                'answer' => "Food packages typically range from ₹1,000 to ₹1,500 per adult per day for all meals (Breakfast, Lunch, Hi-Tea, Dinner). Children aged 6-12 are usually charged between ₹600 and ₹800. Infants and kids under 5 are free!",
                'category' => 'food',
                'keywords' => json_encode(['food price', 'meal charge', 'cost', 'menu', 'veg', 'non-veg']),
                'priority' => 92,
                'created_at' => now(), 'updated_at' => now()
            ],
            [
                'question' => 'Do you provide Veg and Non-Veg food?',
                'answer' => "Yes, we provide both Veg and Non-Veg options. You can choose your preference during booking. For Non-Veg, we usually serve Chicken and Mutton. Seafood can be arranged at certain coastal properties upon request.",
                'category' => 'food',
                'keywords' => json_encode(['veg', 'nonveg', 'chicken', 'mutton', 'pure veg', 'jain']),
                'priority' => 90,
                'created_at' => now(), 'updated_at' => now()
            ],

            // --- Expanded Pricing ---
            [
                'question' => 'Charges for extra guests?',
                'answer' => "Each property has a base capacity. Additional guests beyond that are usually charged between ₹1,000 and ₹2,000 per night, which includes an extra mattress. You can specify the total number of guests during search to see the accurate price.",
                'category' => 'pricing',
                'keywords' => json_encode(['extra guest', 'mattress', 'additional', 'capacity', 'limit']),
                'priority' => 85,
                'created_at' => now(), 'updated_at' => now()
            ],
            [
                'question' => 'Do you offer discounts for long stays?',
                'answer' => "Yes! For bookings longer than 3 nights, we often provide special discounts. Please contact our support team on WhatsApp for corporate bookings or long-term staycation deals.",
                'category' => 'pricing',
                'keywords' => json_encode(['discount', 'offer', 'long stay', 'staycation', 'corporate', 'cheap']),
                'priority' => 80,
                'created_at' => now(), 'updated_at' => now()
            ],
        ];

        foreach ($faqs as $faq) {
            $exists = DB::table('chatbot_faqs')->where('question', $faq['question'])->exists();
            if (!$exists) {
                DB::table('chatbot_faqs')->insert($faq);
            }
        }

        // Update existing "List Property" FAQ to ensure payload is correct and button works
        DB::table('chatbot_faqs')
            ->where('question', 'How do I list my property?')
            ->update([
                'action_type' => 'link',
                'action_payload' => json_encode(['url' => 'https://resortwala.com/signup']),
                'answer' => "You can partner with us and list your villa or waterpark! Simply visit our partner portal to get started and a manager will verify your details."
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No reversed action
    }
};
