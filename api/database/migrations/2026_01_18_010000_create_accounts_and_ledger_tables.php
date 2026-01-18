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
        // 1. Accounts Table - Authoritative source for balances
        Schema::create('accounts', function (Blueprint $table) {
            $table->id('account_id');
            $table->string('entity_type'); // property, vendor, connector, customer, platform
            $table->unsignedBigInteger('entity_reference_id');
            $table->decimal('opening_balance', 15, 2)->default(0.00);
            $table->decimal('current_balance', 15, 2)->default(0.00);
            $table->string('currency', 3)->default('INR');
            $table->enum('status', ['active', 'paused', 'closed'])->default('active');
            $table->unique(['entity_type', 'entity_reference_id']);
            $table->timestamps();
        });

        // 2. Ledger Entries Table - Immutable double-entry records
        Schema::create('ledger_entries', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('debit_account_id');
            $table->unsignedBigInteger('credit_account_id');
            $table->decimal('amount', 15, 2);
            $table->string('currency', 3)->default('INR');
            $table->string('reference_type')->nullable(); // booking, refund, adjustment, penalty
            $table->string('reference_id')->nullable();
            $table->string('description')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->string('ip_address')->nullable();
            $table->timestamps();

            $table->foreign('debit_account_id')->references('account_id')->on('accounts');
            $table->foreign('credit_account_id')->references('account_id')->on('accounts');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            
            // Note: Indices for fast lookup
            $table->index(['reference_type', 'reference_id']);
        });

        // 3. Prevent direct balance updates via Trigger (if using MySQL/PostgreSQL)
        // Note: For now we will enforce this via Laravel Service Guard as requested.
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ledger_entries');
        Schema::dropIfExists('accounts');
    }
};
