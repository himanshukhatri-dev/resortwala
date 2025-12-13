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
        Schema::create('holidays', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')->nullable()->constrained('property_masters', 'PropertyId')->onDelete('cascade');
            $table->string('name');
            $table->date('from_date');
            $table->date('to_date');
            $table->decimal('base_price', 10, 2)->nullable();
            $table->decimal('extra_person_price', 10, 2)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('holidays');
    }
};
