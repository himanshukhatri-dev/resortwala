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
        Schema::table('property_masters', function (Blueprint $table) {
            // Add Rating column
            // We use decimal(3, 1) to allow values like 4.5, 5.0
            $table->decimal('Rating', 3, 1)->nullable()->default(null)->after('PropertyType');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('property_masters', function (Blueprint $table) {
            $table->dropColumn('Rating');
        });
    }
};
