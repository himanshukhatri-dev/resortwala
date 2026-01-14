<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('property_addons', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('property_id');
            $table->string('name'); // e.g., "BBQ Kit", "Decorations"
            $table->decimal('cost_price', 10, 2)->default(0); // Vendor cost
            $table->decimal('selling_price', 10, 2)->default(0); // Customer price
            $table->string('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('property_id')->references('PropertyId')->on('property_masters')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('property_addons');
    }
};
