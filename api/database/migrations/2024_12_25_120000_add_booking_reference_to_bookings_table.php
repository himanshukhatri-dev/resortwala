<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->string('booking_reference', 20)->nullable()->unique()->after('BookingId');
        });

        // Backfill existing bookings
        $bookings = DB::table('bookings')->get();
        foreach ($bookings as $booking) {
            $ref = 'RES-' . strtoupper(Str::random(8));
            // Ensure uniqueness (simple check)
            while (DB::table('bookings')->where('booking_reference', $ref)->exists()) {
                $ref = 'RES-' . strtoupper(Str::random(8));
            }
            
            DB::table('bookings')
                ->where('BookingId', $booking->BookingId)
                ->update(['booking_reference' => $ref]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn('booking_reference');
        });
    }
};
