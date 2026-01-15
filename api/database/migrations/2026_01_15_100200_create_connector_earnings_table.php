<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('connector_earnings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('connector_id');
            $table->unsignedBigInteger('booking_id'); // Assuming bookings have standard id or similar
            $table->decimal('sale_amount', 10, 2);
            $table->decimal('commission_amount', 10, 2);
            $table->string('payout_status')->default('pending'); // pending, paid
            $table->timestamps();

            $table->foreign('connector_id')->references('id')->on('connectors')->onDelete('cascade');
            // $table->foreign('booking_id')->references('id')->on('bookings'); 
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('connector_earnings');
    }
};
