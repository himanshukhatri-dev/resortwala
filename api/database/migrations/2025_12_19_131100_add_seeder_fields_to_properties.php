<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('property_masters', function (Blueprint $table) {
            // Add new modern fields expected by Seeder
            $table->json('Amenities')->nullable();
            $table->json('Images')->nullable();
            
            // Standardize names (Seeder uses these)
            if (!Schema::hasColumn('property_masters', 'Description')) {
                $table->text('Description')->nullable(); // Maps to LongDescription
            }
            if (!Schema::hasColumn('property_masters', 'PricePerNight')) {
                $table->decimal('PricePerNight', 10, 2)->nullable(); // Maps to Price/PerCost
            }
            if (!Schema::hasColumn('property_masters', 'MaxGuests')) {
                $table->integer('MaxGuests')->nullable(); // Maps to MaxCapacity
            }
            if (!Schema::hasColumn('property_masters', 'Bedrooms')) {
                $table->integer('Bedrooms')->nullable(); // Maps to NoofRooms
            }
            if (!Schema::hasColumn('property_masters', 'Bathrooms')) {
                $table->integer('Bathrooms')->nullable(); // Maps to NoofBathRooms
            }
            if (!Schema::hasColumn('property_masters', 'Status')) {
                $table->string('Status')->default('active'); // Maps to PropertyStatus
            }
            if (!Schema::hasColumn('property_masters', 'is_approved')) {
                $table->boolean('is_approved')->default(true); // Required by Controller
            }
        });
    }

    public function down(): void
    {
        Schema::table('property_masters', function (Blueprint $table) {
            $table->dropColumn(['Amenities', 'Images', 'Description', 'PricePerNight', 'MaxGuests', 'Bedrooms', 'Bathrooms', 'Status']);
        });
    }
};
