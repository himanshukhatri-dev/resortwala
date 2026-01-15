<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // Vendor Leads Table (Core Intelligence)
        // Check if exists to avoid conflicts, or modify
        if (!Schema::hasTable('vendor_leads')) {
            Schema::create('vendor_leads', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('source')->default('manual'); // google, osm, manual
                $table->string('source_id')->nullable()->index(); // Google Place ID
                $table->string('phone')->nullable()->index(); // Normalized phone for dedupe
                $table->string('email')->nullable();
                $table->string('website')->nullable();
                $table->string('google_maps_link')->nullable();
                
                // Geo-Location
                $table->decimal('latitude', 10, 8)->nullable();
                $table->decimal('longitude', 11, 8)->nullable();
                $table->string('city')->nullable();
                $table->string('address')->nullable();
                
                // Intelligence Fields
                $table->decimal('rating', 3, 2)->nullable(); // 4.5
                $table->integer('review_count')->default(0);
                $table->string('category')->nullable(); // Resort, Villa, Hotel
                $table->json('raw_data')->nullable(); // Store full API response for future enrichment
                
                // CRM Status
                $table->string('status')->default('new'); // new, contacted, interested, converted, invalid
                $table->integer('confidence_score')->default(0); // 0-100 indicating likelihood of being a valid target
                $table->boolean('is_opt_out')->default(false); // Compliance
                
                $table->timestamps();
            });
        }

        // Crawl Jobs (Monitoring)
        Schema::create('crawl_jobs', function (Blueprint $table) {
            $table->id();
            $table->string('city');
            $table->string('source')->default('google');
            $table->string('status')->default('pending'); // pending, running, completed, failed
            $table->integer('leads_found')->default(0);
            $table->integer('leads_added')->default(0);
            $table->text('error_message')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->unsignedBigInteger('triggered_by')->nullable(); // Admin User ID
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('crawl_jobs');
        Schema::dropIfExists('vendor_leads');
    }
};
