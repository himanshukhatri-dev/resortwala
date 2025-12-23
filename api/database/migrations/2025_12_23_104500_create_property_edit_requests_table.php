<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('property_edit_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')->constrained('property_masters', 'PropertyId')->onDelete('cascade');
            $table->foreignId('vendor_id')->constrained('users')->onDelete('cascade');
            $table->json('changes_json'); // Stores the fields that were changed
            $table->string('status')->default('pending'); // pending, approved, rejected
            $table->text('admin_feedback')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('property_edit_requests');
    }
};
