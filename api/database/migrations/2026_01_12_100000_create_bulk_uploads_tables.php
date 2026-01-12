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
        Schema::create('bulk_uploads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // The admin who uploaded
            $table->string('file_name');
            $table->string('status')->default('PENDING'); // PENDING, PROCESSING, COMPLETED, FAILED
            $table->integer('total_rows')->default(0);
            $table->integer('processed_rows')->default(0);
            $table->integer('failed_rows')->default(0);
            $table->timestamps();
        });

        Schema::create('bulk_upload_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bulk_upload_id')->constrained()->onDelete('cascade');
            $table->integer('row_number');
            $table->json('data'); // snapshot of the row data
            $table->string('status')->default('PENDING'); // PENDING, SUCCESS, FAILED
            $table->foreignId('property_id')->nullable()->constrained('property_masters', 'PropertyId')->nullOnDelete();
            $table->json('error_message')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bulk_upload_entries');
        Schema::dropIfExists('bulk_uploads');
    }
};
