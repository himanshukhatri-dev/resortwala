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
        // 1. Vendor Onboarding Leads
        Schema::create('vendor_onboarding_leads', function (Blueprint $table) {
            $table->id();
            $table->string('vendor_name');
            $table->string('contact_person')->nullable();
            $table->string('phone')->index();
            $table->string('email')->nullable()->index();
            $table->string('city')->nullable();
            $table->string('area')->nullable();
            $table->string('property_type')->nullable(); // Villa, Resort, etc.
            $table->string('source')->nullable();
            $table->string('status')->default('new')->index();
            $table->unsignedBigInteger('assigned_to')->nullable()->index();
            $table->unsignedBigInteger('last_updated_by')->nullable();
            $table->string('website')->nullable();
            $table->decimal('rating', 3, 2)->nullable();
            $table->integer('reviews_count')->default(0);
            $table->string('priority')->default('medium'); // low, medium, high
            $table->timestamp('last_contact_at')->nullable();
            $table->timestamp('next_follow_up_at')->nullable();
            $table->timestamps();

            $table->foreign('assigned_to')->references('id')->on('users')->onDelete('set null');
            $table->foreign('last_updated_by')->references('id')->on('users')->onDelete('set null');
        });

        // 2. Vendor Lead Interactions
        Schema::create('vendor_lead_interactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vendor_lead_id')->constrained('vendor_onboarding_leads')->onDelete('cascade');
            $table->unsignedBigInteger('agent_id')->index();
            $table->string('interaction_type'); // Call, WhatsApp, Email, Meeting
            $table->string('outcome'); // Interested, Callback, Rejected
            $table->text('notes');
            $table->timestamp('follow_up_at')->nullable();
            $table->json('attachments')->nullable();
            $table->timestamps();

            $table->foreign('agent_id')->references('id')->on('users')->onDelete('cascade');
        });

        // 3. Vendor Lead Tasks
        Schema::create('vendor_lead_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vendor_lead_id')->constrained('vendor_onboarding_leads')->onDelete('cascade');
            $table->string('task_type'); // Follow-up, Collection, Visit
            $table->string('title');
            $table->text('description')->nullable();
            $table->timestamp('due_at')->nullable();
            $table->string('status')->default('pending')->index();
            $table->unsignedBigInteger('assigned_to')->index();
            $table->timestamps();

            $table->foreign('assigned_to')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vendor_lead_tasks');
        Schema::dropIfExists('vendor_lead_interactions');
        Schema::dropIfExists('vendor_onboarding_leads');
    }
};
