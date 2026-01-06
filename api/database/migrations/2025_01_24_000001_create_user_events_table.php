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
        if (!Schema::hasTable('user_events')) {
            Schema::create('user_events', function (Blueprint $table) {
                $table->id();
                $table->string('session_id', 64)->index();
                $table->unsignedBigInteger('user_id')->nullable()->index();
                $table->string('event_type', 50)->index();
                $table->string('event_category', 50)->index();
                $table->json('event_data');
                $table->json('context');
                $table->timestamp('created_at')->useCurrent()->index();
                
                // Foreign key (optional)
                $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_events');
    }
};
