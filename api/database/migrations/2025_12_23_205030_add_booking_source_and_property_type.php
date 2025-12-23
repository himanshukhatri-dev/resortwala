<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddBookingSourceAndPropertyType extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Add booking_source to bookings table
        Schema::table('bookings', function (Blueprint $table) {
            $table->string('booking_source', 50)->default('customer_app')->after('Status');
            // Values: 'customer_app', 'public_calendar', 'vendor_manual', 'admin_manual'
        });
        
        // Add property_type to properties table if it doesn't exist
        if (Schema::hasTable('properties')) {
            Schema::table('properties', function (Blueprint $table) {
                if (!Schema::hasColumn('properties', 'property_type')) {
                    $table->string('property_type', 50)->default('villa')->after('Status');
                    // Values: 'villa', 'waterpark', 'resort', etc.
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn('booking_source');
        });
        
        if (Schema::hasTable('properties')) {
            Schema::table('properties', function (Blueprint $table) {
                if (Schema::hasColumn('properties', 'property_type')) {
                    $table->dropColumn('property_type');
                }
            });
        }
    }
}
