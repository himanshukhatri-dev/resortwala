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
        Schema::create('bookings', function (Blueprint $table) {
            $table->id('BookingId');
            $table->unsignedBigInteger('PropertyId');
            $table->string('booking_reference', 20)->nullable()->unique();
            $table->string('CustomerName');
            $table->string('CustomerMobile');
            $table->string('CustomerEmail')->nullable(); // Optional contact
            $table->date('CheckInDate');
            $table->date('CheckOutDate');
            $table->integer('Guests');
            $table->decimal('TotalAmount', 10, 2)->nullable(); // Calculated later
            $table->string('Status')->default('Pending'); // Pending, Confirmed, Cancelled
            $table->text('SpecialRequest')->nullable();
            
            $table->timestamps();

            // Foreign Key constraint (assuming property_masters uses PropertyId as integer/bigint)
            // Note: property_masters uses $table->id('PropertyId') which is BigInteger.
            // But we need to make sure the table exists first. It does (Migrated in Slice 1).
            // Avoiding strict FK constraint for now to prevent migration dependency issues during dev, 
            // but in prod we should have it. Let's add it if we are confident.
            // $table->foreign('PropertyId')->references('PropertyId')->on('property_masters');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
