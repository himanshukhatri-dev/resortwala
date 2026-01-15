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
        Schema::create('event_logs', function (Blueprint $table) {
            $table->id();
            $table->string('event_name')->index();
            $table->string('event_category')->index(); // customer, vendor, admin, system
            $table->unsignedBigInteger('user_id')->nullable()->index();
            $table->string('role')->nullable()->index();
            $table->string('session_id')->nullable()->index();
            $table->string('entity_type')->nullable()->index(); // property, coupon, payment
            $table->string('entity_id')->nullable()->index();
            $table->string('screen_name')->nullable();
            $table->string('action')->nullable();
            $table->json('metadata')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->string('device_type')->nullable();
            $table->string('browser')->nullable();
            $table->integer('response_time')->nullable(); // in ms
            $table->string('status')->nullable(); // success, fail
            $table->string('error_code')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('event_logs');
    }
};
