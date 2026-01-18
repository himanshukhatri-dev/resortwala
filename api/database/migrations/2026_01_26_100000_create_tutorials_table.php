<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('tutorials', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('category')->default('onboarding'); // onboarding, pricing, booking, etc.
            $table->string('target_role')->default('vendor');  // vendor, admin, staff
            $table->boolean('is_published')->default(false);
            $table->string('thumbnail_path')->nullable();
            $table->integer('duration_seconds')->default(0);
            $table->timestamps();
        });

        Schema::create('tutorial_steps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tutorial_id')->constrained()->onDelete('cascade');
            $table->integer('order_index')->default(0);
            $table->text('script_content')->nullable(); // TTS Text
            $table->string('media_path')->nullable(); // Screenshot or Video clip
            $table->string('media_type')->default('image'); // image, video
            
            // JSON metadata for overlays: 
            // { 
            //   "highlight": { "x": 100, "y": 200, "w": 50, "h": 20 }, 
            //   "cursor": { "start": [0,0], "end": [100,200], "action": "click" } 
            // }
            $table->json('visual_metadata')->nullable(); 
            
            $table->float('duration')->default(5.0); // Step duration
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('tutorial_steps');
        Schema::dropIfExists('tutorials');
    }
};
