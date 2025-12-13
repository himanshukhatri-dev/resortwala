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
        Schema::create('property_masters', function (Blueprint $table) {
            $table->id('PropertyId'); // Primary Key
            $table->integer('VendorId')->nullable();
            $table->string('Name')->nullable();
            $table->string('ShortName')->nullable();
            $table->string('PropertyType')->nullable();
            $table->decimal('Price', 10, 2)->nullable();
            $table->decimal('DealPrice', 10, 2)->nullable();
            $table->string('Tax')->nullable();
            $table->text('Address')->nullable();
            $table->text('LongDescription')->nullable();
            $table->text('ShortDescription')->nullable();
            $table->string('Website')->nullable();
            $table->string('Email')->nullable();
            $table->string('MobileNo')->nullable();
            $table->boolean('IsActive')->default(true);
            $table->string('GSTNo')->nullable();
            $table->string('ContactPerson')->nullable();
            $table->string('CityName')->nullable();
            $table->text('GoogleMapLink')->nullable();
            $table->string('CityLatitude')->nullable();
            $table->string('CityLongitude')->nullable();
            $table->string('Location')->nullable();
            $table->string('PaymentFacitlity')->nullable();
            $table->string('AvailabilityType')->nullable();
            $table->integer('NoofBathRooms')->nullable();
            $table->integer('NoofQueenBeds')->nullable();
            $table->string('Occupancy')->nullable();
            $table->text('BookingSpecailMessage')->nullable();
            $table->text('PropertyOffersDetails')->nullable();
            $table->text('PropertyRules')->nullable();
            $table->boolean('IsDeleted')->default(false);
            $table->decimal('PerCost', 10, 2)->nullable();
            $table->string('ResortWalaRate')->nullable();
            $table->boolean('PropertyStatus')->default(true);
            $table->boolean('IsVendorPropAvailable')->default(true);
            $table->boolean('IsPropertyUpdate')->default(false);
            $table->integer('NoofRooms')->nullable();
            
            // Audit + Timestamps
            $table->integer('CreatedBy')->nullable();
            $table->timestamp('CreatedOn')->nullable();
            $table->integer('UpdatedBy')->nullable();
            $table->timestamp('UpdatedOn')->nullable();
            
            // Extra
            $table->date('CheckinDate')->nullable();
            $table->date('CheckoutDate')->nullable();
            $table->string('Breakfast')->nullable();
            $table->string('Lunch')->nullable();
            $table->string('Dinner')->nullable();
            $table->string('HiTea')->nullable();
            $table->integer('MaxCapacity')->nullable();

            $table->timestamps(); // Standard Laravel timestamps (optional)
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('property_masters');
    }
};
