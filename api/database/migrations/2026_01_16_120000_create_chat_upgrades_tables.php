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
        // 1. Content Registry (Single Source of Truth)
        Schema::create('content_registry', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique(); // e.g., 'policy.cancellation', 'property.details.villa_amenities'
            $table->string('title');
            $table->longText('body_html');
            $table->string('source_page')->nullable();
            $table->string('version')->default('1.0');
            $table->string('last_updated_by')->nullable();
            $table->timestamps();
        });

        // 2. Customer Queries (Escalation)
        Schema::create('customer_queries', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('mobile')->nullable();
            $table->text('question');
            $table->string('page_context')->nullable();
            $table->string('status')->default('pending'); // pending, responded, junk
            $table->text('admin_notes')->nullable();
            $table->timestamps();
        });

        // 3. Upgrade FAQ Table
        Schema::table('chatbot_faqs', function (Blueprint $table) {
            $table->string('category')->default('General')->after('id'); // Booking, Pricing, etc.
            $table->text('keywords')->nullable()->after('answer'); // For smart matching
            $table->unsignedBigInteger('content_registry_id')->nullable()->after('answer'); // Link to registry
            $table->boolean('visible_to_vendors')->default(false)->after('is_active'); // Customer only by default
            
            // Foreign key to content registry
            // $table->foreign('content_registry_id')->references('id')->on('content_registry');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chatbot_faqs', function (Blueprint $table) {
            $table->dropColumn(['category', 'keywords', 'content_registry_id', 'visible_to_vendors']);
        });
        Schema::dropIfExists('customer_queries');
        Schema::dropIfExists('content_registry');
    }
};
