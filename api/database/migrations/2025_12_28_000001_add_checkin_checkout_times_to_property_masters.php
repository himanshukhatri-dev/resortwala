<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('property_masters', function (Blueprint $table) {
            $table->time('checkInTime')->nullable()->after('PropertyType');
            $table->time('checkOutTime')->nullable()->after('checkInTime');
        });
    }

    public function down(): void
    {
        Schema::table('property_masters', function (Blueprint $table) {
            $table->dropColumn(['checkInTime', 'checkOutTime']);
        });
    }
};
