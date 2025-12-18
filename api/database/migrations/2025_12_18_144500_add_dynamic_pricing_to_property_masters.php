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
            $table->decimal('price_mon_thu', 10, 2)->nullable()->comment('Price for Monday to Thursday')->after('PricePerNight');
            $table->decimal('price_fri_sun', 10, 2)->nullable()->comment('Price for Friday and Sunday')->after('price_mon_thu');
            $table->decimal('price_sat', 10, 2)->nullable()->comment('Price for Saturday')->after('price_fri_sun');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('property_masters', function (Blueprint $table) {
            $table->dropColumn(['price_mon_thu', 'price_fri_sun', 'price_sat']);
        });
    }
};
