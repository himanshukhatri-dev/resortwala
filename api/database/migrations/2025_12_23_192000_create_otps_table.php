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
        Schema::create('otps', function (Blueprint $blueprint) {
            $blueprint->id();
            $blueprint->string('identifier')->index(); // email or mobile
            $blueprint->string('code');
            $blueprint->string('type')->default('login'); // login, reset, etc.
            $blueprint->timestamp('expires_at');
            $blueprint->timestamp('verified_at')->nullable();
            $blueprint->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('otps');
    }
};
