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
        Schema::table('property_masters', function (Blueprint $table) {
            if (!Schema::hasColumn('property_masters', 'Latitude')) {
                $table->decimal('Latitude', 10, 8)->nullable();
            }
            if (!Schema::hasColumn('property_masters', 'Longitude')) {
                $table->decimal('Longitude', 11, 8)->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('property_masters', function (Blueprint $table) {
            $table->dropColumn(['Latitude', 'Longitude']);
        });
    }
};
