<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reconciliation_batches', function (Blueprint $table) {
            $table->id();
            $table->string('filename');
            $table->unsignedBigInteger('uploaded_by')->nullable();
            $table->string('status')->default('processing'); // processing, completed, failed
            $table->integer('total_records')->default(0);
            $table->integer('matched_records')->default(0);
            $table->integer('mismatched_records')->default(0);
            $table->timestamps();

            $table->foreign('uploaded_by')->references('id')->on('users')->onDelete('set null');
        });

        Schema::create('reconciliation_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('batch_id')->constrained('reconciliation_batches')->onDelete('cascade');
            $table->string('booking_reference')->nullable()->index(); // From Bank Statement
            $table->string('transaction_id')->nullable()->index(); // From Bank Statement
            $table->date('transaction_date')->nullable();
            $table->decimal('amount_bank', 10, 2)->default(0);
            $table->decimal('amount_system', 10, 2)->nullable();
            $table->unsignedBigInteger('booking_id')->nullable(); // Linked System Booking
            $table->string('status')->default('pending'); 
            // matched (Amounts match), mismatch (Amounts differ), missing_in_system (Bank has it, System doesn't), missing_in_bank (System has it, Bank doesn't - separate logic mostly)
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('booking_id')->references('BookingId')->on('bookings')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reconciliation_records');
        Schema::dropIfExists('reconciliation_batches');
    }
};
