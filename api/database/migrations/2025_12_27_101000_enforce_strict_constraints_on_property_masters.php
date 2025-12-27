<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Fix: Assign orphaned properties to the first user before enforcing NOT NULL
        $firstUserId = DB::table('users')->value('id');
        if ($firstUserId) {
            DB::table('property_masters')->whereNull('vendor_id')->update(['vendor_id' => $firstUserId]);
        }

        // Enforce NOT NULL and basic constraints on existing columns
        Schema::table('property_masters', function (Blueprint $table) {
            // First, ensure critical fields are not null (where data already exists)
            // We might need to clean up nulls before this, but for a strict system, we assume they have data or we set a default.
            $table->string('Name')->nullable(false)->change();
            $table->string('Location')->nullable(false)->change();
            $table->string('PropertyType')->nullable(false)->change();
            $table->decimal('Price', 10, 2)->nullable(false)->default(0)->change();
            $table->unsignedBigInteger('vendor_id')->nullable(false)->change();
        });

        // Add CHECK constraints using raw SQL (as Laravel doesn't have a direct helper for all CHECKs in older versions or for cross-DB compatibility)
        // Since it's likely MySQL, we add CHECK constraints.
        DB::statement("ALTER TABLE property_masters ADD CONSTRAINT check_price_positive CHECK (Price >= 0)");
        DB::statement("ALTER TABLE property_masters ADD CONSTRAINT check_max_capacity_positive CHECK (MaxCapacity >= 0 OR MaxCapacity IS NULL)");
        DB::statement("ALTER TABLE property_masters ADD CONSTRAINT check_noof_rooms_positive CHECK (NoofRooms >= 0 OR NoofRooms IS NULL)");
        
        // Ensure status defaults are correct
        Schema::table('property_masters', function (Blueprint $table) {
            $table->boolean('is_approved')->default(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('property_masters', function (Blueprint $table) {
            $table->string('Name')->nullable()->change();
            $table->string('Location')->nullable()->change();
            $table->string('PropertyType')->nullable()->change();
            $table->decimal('Price', 10, 2)->nullable()->change();
            $table->unsignedBigInteger('vendor_id')->nullable()->change();
        });

        DB::statement("ALTER TABLE property_masters DROP CHECK check_price_positive");
        DB::statement("ALTER TABLE property_masters DROP CHECK check_max_capacity_positive");
        DB::statement("ALTER TABLE property_masters DROP CHECK check_noof_rooms_positive");
    }
};
