<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('site_configs', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('group')->default('general'); // general, contact, social, seo
            $table->string('type')->default('text'); // text, json, boolean
            $table->timestamps();
        });

        // Seed basic config
        $configs = [
            ['key' => 'site_name', 'value' => 'ResortWala', 'group' => 'general'],
            ['key' => 'support_email', 'value' => 'support@resortwala.com', 'group' => 'contact'],
            ['key' => 'support_phone', 'value' => '+91 9876543210', 'group' => 'contact'],
            ['key' => 'instagram_url', 'value' => 'https://instagram.com/resortwala', 'group' => 'social'],
            ['key' => 'meta_title', 'value' => 'ResortWala - India\'s Largest Resort Booking Platform', 'group' => 'seo'],
            ['key' => 'meta_description', 'value' => 'Find and book the best resorts and waterparks across India.', 'group' => 'seo'],
        ];

        foreach ($configs as $config) {
            \Illuminate\Support\Facades\DB::table('site_configs')->insert(array_merge($config, [
                'created_at' => now(),
                'updated_at' => now()
            ]));
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('site_configs');
    }
};
