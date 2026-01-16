<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('video_render_jobs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')->constrained('property_masters', 'PropertyId')->onDelete('cascade');
            $table->string('template_id');
            $table->enum('status', ['pending', 'processing', 'completed', 'failed'])->default('pending');
            $table->json('options')->nullable(); // Stores text overlays, music choice, selected media IDs
            $table->string('output_path')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('video_render_jobs');
    }
};
