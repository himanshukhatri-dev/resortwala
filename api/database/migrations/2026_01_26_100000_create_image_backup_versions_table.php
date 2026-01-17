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
        Schema::create('image_backup_versions', function (Blueprint $table) {
            $table->id();
            
            // Link to property_images
            $table->unsignedBigInteger('image_id');
            $table->foreign('image_id')
                  ->references('id')
                  ->on('property_images')
                  ->onDelete('cascade');

            $table->string('original_path');
            $table->string('backup_path');
            $table->string('checksum')->nullable(); // SHA256 of the backup
            $table->string('backup_batch_id')->index(); // To group backups (e.g. "pre-watermark-2026-01-17")
            
            $table->timestamp('backed_up_at')->useCurrent();
            $table->string('backed_up_by')->nullable()->default('system'); // User ID or 'system'
            
            $table->string('status')->default('verified'); // verified, restored, error
            $table->json('metadata')->nullable(); // Store EXIF or original dimensions
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('image_backup_versions');
    }
};
