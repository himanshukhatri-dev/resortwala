<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('property_daily_rates', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('property_id');
            
            // 0=Sunday, 1=Monday, ... 6=Saturday
            $table->tinyInteger('day_of_week'); 
            
            $table->decimal('base_price', 10, 2);
            $table->decimal('extra_person_price', 10, 2)->nullable();
            $table->decimal('child_price', 10, 2)->nullable();
            
            $table->date('effective_from');
            $table->date('effective_to')->nullable();
            
            $table->timestamps();

            $table->foreign('property_id')->references('PropertyId')->on('property_masters')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('property_daily_rates');
    }
};
