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
        Schema::create('s_e_o_configs', function (Blueprint $table) {
            $table->id();
            $table->string('page_type'); // city_landing, category_landing, etc.
            $table->string('slug')->unique(); // waterparks-near-mumbai
            $table->string('target_city')->nullable();
            $table->string('target_category')->nullable(); // waterpark, villa, resort

            // Meta Content
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();
            $table->text('meta_keywords')->nullable();

            // Rich Content for the page
            $table->string('h1_title')->nullable();
            $table->text('about_content')->nullable();
            $table->json('faqs')->nullable(); // Array of {q, a} pairs

            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('s_e_o_configs');
    }
};
