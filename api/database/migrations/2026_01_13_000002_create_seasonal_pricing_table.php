<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('seasonal_pricing', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g., "Diwali Surge", "Monsoon Sale"
            $table->date('start_date');
            $table->date('end_date');
            $table->json('properties_included')->nullable(); // IDs of properties this applies to, or null for all
            $table->json('rules'); // { "base_adjustment": "+10%", "meal_adjustment": "0", "priority": 10 }
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('seasonal_pricing');
    }
};
