<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('property_masters', function (Blueprint $table) {
            if (!Schema::hasColumn('property_masters', 'admin_pricing')) {
                $table->json('admin_pricing')->nullable();
            }
            if (!Schema::hasColumn('property_masters', 'onboarding_data')) {
                $table->json('onboarding_data')->nullable(); // For flexible attributes
            }
            if (!Schema::hasColumn('property_masters', 'is_approved')) {
                $table->boolean('is_approved')->default(false);
            }
            // Ensure video_url exists too
            if (!Schema::hasColumn('property_masters', 'video_url')) {
                $table->string('video_url')->nullable();
            }
        });
    }

    public function down()
    {
        Schema::table('property_masters', function (Blueprint $table) {
            $table->dropColumn(['admin_pricing', 'onboarding_data', 'is_approved', 'video_url']);
        });
    }
};
