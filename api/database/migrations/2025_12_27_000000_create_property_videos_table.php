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
        Schema::create('property_videos', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('property_id');
            $table->string('video_path');
            $table->integer('display_order')->default(0);
            $table->timestamps();

            // Foreign key usually matches property_masters table
            // However, looking at PropertyMaster.php, the primary key is PropertyId
            $table->foreign('property_id')->references('PropertyId')->on('property_masters')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('property_videos');
    }
};
