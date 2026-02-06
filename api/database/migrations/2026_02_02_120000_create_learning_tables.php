<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // 1. Learning Modules (The Tutorials)
        Schema::create('learning_modules', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('category')->default('onboarding'); // onboarding, feature, advanced
            $table->string('difficulty')->default('beginner'); // beginner, intermediate, expert
            $table->integer('duration_seconds')->default(0);
            $table->boolean('is_active')->default(true);
            $table->json('meta_tags')->nullable(); // For search/filtering
            $table->timestamps();
        });

        // 2. Learning Steps (The Actions)
        Schema::create('learning_steps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->constrained('learning_modules')->onDelete('cascade');
            $table->integer('step_order');
            $table->string('action_type', 50); // navigate, click, input, wait, highlight, verification
            $table->string('selector')->nullable(); // CSS Selector
            $table->string('path')->nullable(); // URL Path
            $table->json('payload')->nullable(); // Extra data (text to type, wait time)
            $table->text('narration_text')->nullable(); // Script for AI
            $table->string('audio_url')->nullable(); // Generated TTS file path
            $table->timestamps();
            
            // Index for fast retrieval
            $table->index(['module_id', 'step_order']);
        });

        // 3. User Progress Tracking
        Schema::create('vendor_learning_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vendor_id')->constrained('users')->onDelete('cascade'); // Assuming users table for vendors
            $table->foreignId('module_id')->constrained('learning_modules')->onDelete('cascade');
            $table->string('status', 20)->default('started'); // started, complated, skipped
            $table->integer('current_step')->default(0);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['vendor_id', 'module_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('vendor_learning_progress');
        Schema::dropIfExists('learning_steps');
        Schema::dropIfExists('learning_modules');
    }
};
