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
        Schema::create('voice_projects', function (Blueprint $table) {
            $table->id();
            $table->string('title')->nullable();
            $table->text('script_text');
            $table->string('language')->default('en'); // en, hi, hinglish
            $table->string('voice_id'); // cinematic_male, etc.
            $table->string('visual_type')->default('avatar'); // avatar, cinematic
            $table->json('visual_options')->nullable(); // property_id, avatar_id
            $table->string('status')->default('draft'); // draft, processing, completed, failed
            $table->string('output_url')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('voice_projects');
    }
};
