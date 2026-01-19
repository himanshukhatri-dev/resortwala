<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // Store FCM Tokens
        Schema::create('user_device_tokens', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id'); // Linked to users table
            $table->string('device_token')->unique();
            $table->string('platform')->default('android'); // android, ios, web
            $table->timestamp('last_seen_at')->useCurrent();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        // Audit Logs for Notifications
        Schema::create('notification_logs', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('body');
            $table->string('audience_type'); // all, vendor, specific, topic
            $table->json('audience_data')->nullable(); // user_ids list or topic name
            $table->integer('sent_count')->default(0);
            $table->integer('success_count')->default(0);
            $table->integer('failure_count')->default(0);
            $table->unsignedBigInteger('created_by')->nullable(); // Admin ID
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('notification_logs');
        Schema::dropIfExists('user_device_tokens');
    }
};
