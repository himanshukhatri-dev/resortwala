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
        Schema::table('property_masters', function (Blueprint $table) {
            // A comprehensive JSON column to store all the dynamic checkboxes, counters, and rule sets.
            // This avoids creating 50+ individual columns for "Small Pools", "Big Pools", "Selfie Point", etc.
            $table->longText('onboarding_data')->nullable(); 
            
            // Explicit columns for critical search/filter fields if needed, 
            // but for now, the user's list is mostly descriptive features.
            
            $table->string('video_url')->nullable();
            
            // Ensure Payment options are stored
             // already have PaymentFacitlity, but maybe we need a structured array?
             // We can use onboarding_data['payment_methods'] for that.
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('property_masters', function (Blueprint $table) {
            $table->dropColumn(['onboarding_data', 'video_url']);
        });
    }
};
