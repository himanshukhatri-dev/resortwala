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
            // --- Booking & Payments ---
            [
                'question' => 'How can I pay for my booking?',
                'answer' => "We accept all major payment methods including UPI (GPay, PhonePe), Credit/Debit Cards, and Net Banking. You can pay securely directly through our website.",
                'category' => 'payments',
                'keywords' => json_encode(['pay', 'payment', 'card', 'upi', 'gpay', 'phonepe', 'cash']),
                'priority' => 95,
                'created_at' => now(), 'updated_at' => now()
            ],
            [
                'question' => 'Do you take advance payment?',
                'answer' => "Yes, a 50% advance payment is usually required to confirm your booking. The remaining balance can be paid at check-in or as per the specific property rule.",
                'category' => 'payments',
                'keywords' => json_encode(['advance', 'deposit', 'booking amount', 'partial']),
                'priority' => 90,
                'created_at' => now(), 'updated_at' => now()
            ],
            [
                'question' => 'What is your cancellation policy?',
                'answer' => "Cancellation policies vary by property. Generally, free cancellation is available up to 7 days before check-in. You can view the specific policy on the property details page before booking.",
                'category' => 'cancellation',
                'keywords' => json_encode(['cancel', 'refund', 'cancellation', 'money back']),
                'priority' => 95,
                'created_at' => now(), 'updated_at' => now()
            ],
            [
                'question' => 'Is it safe to book online?',
                'answer' => "Building trust is our priority. All our properties are verified, and payments are processed through secure gateways. We guarantee a seamless experience.",
                'category' => 'trust',
                'keywords' => json_encode(['safe', 'trust', 'scam', 'secure', 'verified']),
                'priority' => 100,
                'created_at' => now(), 'updated_at' => now()
            ],

            // --- Property Rules ---
            [
                'question' => 'Are unmarried couples allowed?',
                'answer' => "Most of our properties are couple-friendly, but some may have restrictions. Please check the 'House Rules' section on the specific property page to be sure.",
                'category' => 'rules',
                'keywords' => json_encode(['couple', 'unmarried', 'girlfriend', 'boyfriend', 'partner']),
                'priority' => 85,
                'created_at' => now(), 'updated_at' => now()
            ],
            [
                'question' => 'Are pets allowed?',
                'answer' => "Many of our villas are pet-friendly! Look for the 'Paw' icon or 'Pet Friendly' tag on the property listing. Some may charge a small cleaning fee.",
                'category' => 'rules',
                'keywords' => json_encode(['pet', 'dog', 'cat', 'animal']),
                'priority' => 85,
                'created_at' => now(), 'updated_at' => now()
            ],
            [
                'question' => 'Is alcohol allowed?',
                'answer' => "Alcohol consumption is generally allowed within the property premises for guests above the legal drinking age. However, loud parties or public nuisance is strictly prohibited.",
                'category' => 'rules',
                'keywords' => json_encode(['alcohol', 'drink', 'drinking', 'liquor', 'beer', 'wine']),
                'priority' => 80,
                'created_at' => now(), 'updated_at' => now()
            ],
            [
                'question' => 'Do I need ID proof?',
                'answer' => "Yes, valid government-issued ID proof (Aadhar, Driving License, Passport) for all guests is mandatory at the time of check-in as per government regulations.",
                'category' => 'rules',
                'keywords' => json_encode(['id', 'proof', 'aadhar', 'pan', 'identification', 'checkin']),
                'priority' => 90,
                'created_at' => now(), 'updated_at' => now()
            ],

            // --- Amenities ---
            [
                'question' => 'Is food available?',
                'answer' => "Yes! Most villas offer meal packages (Veg/Non-Veg) prepared by in-house chefs. You can add meal plans during booking or order partially. Some villas also allow outside food.",
                'category' => 'food',
                'keywords' => json_encode(['food', 'meal', 'breakfast', 'lunch', 'dinner', 'chef', 'cook']),
                'priority' => 90,
                'created_at' => now(), 'updated_at' => now()
            ],
            [
                'question' => 'Is swimming pool private?',
                'answer' => "If you book a standalone villa, the pool is exclusively for you! For resort stays, the pool might be shared. Check the 'Amenities' list on the property page.",
                'category' => 'amenities',
                'keywords' => json_encode(['pool', 'swimming', 'private pool', 'shared pool']),
                'priority' => 85,
                'created_at' => now(), 'updated_at' => now()
            ],
            [
                'question' => 'Do you have WiFi?',
                'answer' => "Yes, most of our properties provide high-speed WiFi suitable for workcations. However, in remote locations, connectivity might vary.",
                'category' => 'amenities',
                'keywords' => json_encode(['wifi', 'internet', 'broadband', 'connection']),
                'priority' => 80,
                'created_at' => now(), 'updated_at' => now()
            ],

            // --- Locations & Contact ---
            [
                'question' => 'Where are your villas located?',
                'answer' => "We currently have premium properties in Lonavala, Khandala, Mahabaleshwar, Alibaug, and Karjat. We are expanding to new locations soon!",
                'category' => 'location',
                'keywords' => json_encode(['location', 'where', 'lonavala', 'mumbai', 'pune', 'city']),
                'priority' => 80,
                'created_at' => now(), 'updated_at' => now()
            ],
            [
                'question' => 'How can I contact ResortWala?',
                'answer' => "You can reach our support team via WhatsApp or call us at +91-9999999999. We are available 24/7 to assist you.",
                'action_type' => 'whatsapp',
                'action_payload' => json_encode(['url' => 'https://wa.me/919999999999']),
                'category' => 'contact',
                'keywords' => json_encode(['contact', 'phone', 'support', 'call', 'help', 'number']),
                'priority' => 100,
                'created_at' => now(), 'updated_at' => now()
            ],
            
            // --- General ---
            [
                'question' => 'What are the check-in and check-out times?',
                'answer' => "Standard Check-in is at 1:00 PM and Check-out is at 11:00 AM. Early check-in or late check-out is subject to availability and might be chargeable.",
                'category' => 'rules',
                'keywords' => json_encode(['time', 'checkin', 'checkout', 'early', 'late']),
                'priority' => 85,
                'created_at' => now(), 'updated_at' => now()
            ],
             [
                'question' => 'Pricing for children?',
                'answer' => "Children under 5 years usually stay for free. Children between 6-12 years are charged half price. Anyone above 12 is considered an adult. Check specific property rules.",
                'category' => 'pricing',
                'keywords' => json_encode(['child', 'kids', 'baby', 'children', 'pricing']),
                'priority' => 80,
                'created_at' => now(), 'updated_at' => now()
            ],
        ];

        // Ensure duplicates aren't inserted blindly (basic check)
        foreach ($faqs as $faq) {
            $exists = DB::table('chatbot_faqs')->where('question', $faq['question'])->exists();
            if (!$exists) {
                DB::table('chatbot_faqs')->insert($faq);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No explicit down action to avoid data loss
    }
};
