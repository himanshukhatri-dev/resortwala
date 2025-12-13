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
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['customer', 'vendor', 'admin'])->default('customer')->after('email');
            $table->enum('vendor_type', ['Resort', 'WaterPark', 'Villa'])->nullable()->after('role');
            $table->string('business_name')->nullable()->after('vendor_type');
            $table->string('phone')->nullable()->after('business_name');
            $table->boolean('is_approved')->default(false)->after('phone');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'vendor_type', 'business_name', 'phone', 'is_approved']);
        });
    }
};
