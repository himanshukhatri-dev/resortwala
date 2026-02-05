<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('learning_modules', function (Blueprint $table) {
            $table->string('video_url', 255)->nullable()->after('description');
            $table->string('thumbnail_url', 255)->nullable()->after('video_url');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::table('learning_modules', function (Blueprint $table) {
            $table->dropColumn(['video_url', 'thumbnail_url']);
        });
    }
};
