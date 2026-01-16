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
        Schema::create('chatbot_faqs', function (Blueprint $table) {
            $table->id();
            $table->string('question');
            $table->text('answer'); // Bots response (supports HTML/Markdown)
            $table->string('action_type')->default('none'); // none, link, whatsapp, form
            $table->json('action_payload')->nullable(); // { "url": "...", "form_id": "..." }
            $table->integer('priority')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('chatbot_analytics', function (Blueprint $table) {
            $table->id();
            $table->string('interaction_type'); // open, question_click, whatsapp_click
            $table->unsignedBigInteger('faq_id')->nullable();
            $table->json('metadata')->nullable(); // User agent, page url, etc.
            $table->timestamps();

            // Foreign Key constraint optional but good for integrity
            // $table->foreign('faq_id')->references('id')->on('chatbot_faqs')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chatbot_analytics');
        Schema::dropIfExists('chatbot_faqs');
    }
};
