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
        Schema::create('blogs', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('excerpt')->nullable();
            $table->longText('content');
            $table->string('cover_image')->nullable();
            $table->string('author')->default('ResortWala Team');
            $table->string('category')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->json('tags')->nullable();

            // SEO
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();

            // Intelligence Linking
            $table->unsignedBigInteger('location_id')->nullable();
            // $table->foreign('location_id')->references('id')->on('locations'); // Assuming locations table exists or will exist clearly

            $table->unsignedBigInteger('property_id')->nullable();
            // $table->foreign('property_id')->references('PropertyId')->on('property_masters');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('blogs');
    }
};
