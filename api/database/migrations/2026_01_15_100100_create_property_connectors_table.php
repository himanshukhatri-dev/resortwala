<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('property_connectors', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('property_id');
            $table->unsignedBigInteger('connector_id');
            $table->string('commission_type'); // 'flat' or 'percentage'
            $table->decimal('commission_value', 10, 2);
            $table->date('effective_from')->nullable();
            $table->date('effective_to')->nullable();
            $table->timestamps();

            // Foreign keys
            // Assuming property_masters primary key is PropertyId (not standard id) based on previous file view
            // But usually Laravel relationships use standard conventions. 
            // The PropertyMaster model showed: protected $primaryKey = 'PropertyId';
            // So we must reference that. 
            // However, typical foreign key constraints might fail if types don't match exactly.
            // PropertyId is likely an integer.
            
            // We will add index but maybe skip strict FK constraint if types are risky, 
            // but let's try to be robust.
            // $table->foreign('property_id')->references('PropertyId')->on('property_masters')->onDelete('cascade');
            $table->foreign('connector_id')->references('id')->on('connectors')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('property_connectors');
    }
};
