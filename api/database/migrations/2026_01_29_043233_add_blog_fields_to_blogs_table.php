<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('blogs', function (Blueprint $table) {
            $table->boolean('is_published')->default(false)->after('content');
            $table->integer('views_count')->default(0)->after('is_published');
            $table->string('reading_time')->nullable()->after('views_count');
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('blogs', function (Blueprint $table) {
            $table->dropColumn(['is_published', 'views_count', 'reading_time']);
            $table->dropSoftDeletes();
        });
    }
};
