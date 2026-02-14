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
        Schema::create('phonepe_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('merchant_transaction_id')->unique();
            $table->string('phonepe_transaction_id')->nullable();
            $table->unsignedBigInteger('booking_id')->nullable();
            $table->decimal('amount', 10, 2);
            $table->string('status')->default('pending'); // pending, success, failed, timeout
            $table->string('payment_method')->nullable();
            $table->text('callback_payload')->nullable(); // Store raw callback data
            $table->integer('callback_attempts')->default(0);
            $table->timestamp('payment_initiated_at')->nullable();
            $table->timestamp('payment_completed_at')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();

            $table->index('booking_id');
            $table->index('status');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('phonepe_transactions');
    }
};
