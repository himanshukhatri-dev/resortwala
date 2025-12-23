<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('onboarding_tokens', function (Blueprint $table) {
            $table->id();
            $table->string('user_type'); // 'user' or 'customer'
            $table->unsignedBigInteger('user_id');
            $table->string('token')->unique();
            $table->string('role')->nullable();
            $table->boolean('is_used')->default(false);
            $table->timestamp('expires_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('onboarding_tokens');
    }
};
