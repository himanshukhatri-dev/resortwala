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
        // 1. Notification Templates
        if (!Schema::hasTable('notification_templates')) {
            Schema::create('notification_templates', function (Blueprint $table) {
                $table->id();
                $table->string('name')->unique(); // e.g., 'booking_confirmation_customer'
                $table->string('channel')->comment('email, sms, whatsapp');
                $table->string('subject')->nullable(); // For Email
                $table->text('content');
                $table->json('variables')->nullable(); // e.g., ['customer_name', 'amount']
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // 2. DLT Registries (for SMS Compliance in India)
        if (!Schema::hasTable('dlt_registries')) {
            Schema::create('dlt_registries', function (Blueprint $table) {
                $table->id();
                $table->string('entity_id');
                $table->string('sender_id', 6);
                $table->string('template_id')->unique();
                $table->text('approved_content'); // The exact content approved by DLT
                $table->json('variable_mapping')->nullable(); // Map code vars to DLT vars (e.g., { "otp": "{#var#}" })
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // 3. Notification Triggers (Event -> Template Mapping)
        if (!Schema::hasTable('notification_triggers')) {
            Schema::create('notification_triggers', function (Blueprint $table) {
                $table->id();
                $table->string('event_name')->unique(); // e.g., 'booking.confirmed'
                $table->unsignedBigInteger('email_template_id')->nullable();
                $table->unsignedBigInteger('sms_template_id')->nullable(); // Links to notification_templates (type=sms), which links to DLT
                $table->unsignedBigInteger('whatsapp_template_id')->nullable();
                $table->string('audience')->default('customer'); // customer, vendor, admin
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->foreign('email_template_id')->references('id')->on('notification_templates')->onDelete('set null');
                $table->foreign('sms_template_id')->references('id')->on('notification_templates')->onDelete('set null');
                $table->foreign('whatsapp_template_id')->references('id')->on('notification_templates')->onDelete('set null');
            });
        }

        // 4. Update Logs Table (if exists, else create)
        if (!Schema::hasTable('notification_logs')) {
            Schema::create('notification_logs', function (Blueprint $table) {
                $table->id();
                $table->string('channel'); // email, sms, whatsapp
                $table->string('recipient');
                $table->string('subject')->nullable();
                $table->text('content')->nullable(); // The final rendered content
                $table->string('template_name')->nullable();
                $table->string('event_name')->nullable();
                $table->string('status'); // sent, failed, queued
                $table->text('error_message')->nullable();
                $table->json('metadata')->nullable(); // Provider response ID, cost, etc.
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notification_logs');
        Schema::dropIfExists('notification_triggers');
        Schema::dropIfExists('dlt_registries');
        Schema::dropIfExists('notification_templates');
    }
};
