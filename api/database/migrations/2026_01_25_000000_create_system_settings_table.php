<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->boolean('maintenance_mode')->default(false);
            $table->boolean('coming_soon_mode')->default(false);
            $table->json('maintenance_content')->nullable();
            $table->json('coming_soon_content')->nullable();
            $table->string('developer_bypass_key')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
        });

        // Seed initial data
        \Illuminate\Support\Facades\DB::table('system_settings')->insert([
            'maintenance_mode' => false,
            'coming_soon_mode' => false,
            'maintenance_content' => json_encode([
                'title' => "We’re upgrading your experience 🚀",
                'subtitle' => "Resortwala is undergoing scheduled maintenance.",
                'description' => "We are rolling out new features to serve you better. We'll be back shortly!",
                'estimated_return' => "2 hours",
                'contact_email' => "support@resortwala.com"
            ]),
            'coming_soon_content' => json_encode([
                'title' => "Something amazing is coming ✨",
                'description' => "We're building the future of resort bookings. Stay tuned!",
                'allow_email_capture' => true
            ]),
            'developer_bypass_key' => \Illuminate\Support\Str::random(32),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};
