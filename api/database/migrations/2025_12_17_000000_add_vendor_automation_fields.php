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
            $table->string('share_token')->nullable()->unique()->after('PropertyId');
        });

        Schema::table('bookings', function (Blueprint $table) {
            // Ensure status column can handle new statuses. 
            // If it's an enum, we might need to modify it. 
            // For now, let's assume it's a string or we alter it to string for flexibility.
            $table->string('Status', 50)->default('pending')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('property_masters', function (Blueprint $table) {
            $table->dropColumn('share_token');
        });

        // Reverting status change is tricky without knowing exact previous state, 
        // usually safer to leave it as string or not revert this specific change if compatible.
    }
};
