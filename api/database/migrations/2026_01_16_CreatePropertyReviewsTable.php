<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('property_reviews', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('property_id');
            $table->string('user_name');
            $table->decimal('rating', 2, 1); // e.g. 4.5
            $table->text('comment')->nullable();
            $table->boolean('verified')->default(false);
            $table->timestamps();

            $table->foreign('property_id')->references('PropertyId')->on('property_masters')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('property_reviews');
    }
};
