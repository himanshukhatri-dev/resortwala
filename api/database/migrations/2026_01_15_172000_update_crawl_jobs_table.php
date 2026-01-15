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
        Schema::table('crawl_jobs', function (Blueprint $table) {
            $table->string('category')->nullable()->after('city');
            $table->json('filters_used')->nullable()->after('source');
            $table->integer('new_leads_count')->default(0)->after('leads_found');
            $table->integer('duplicate_leads_count')->default(0)->after('new_leads_count');
            $table->integer('error_count')->default(0)->after('duplicate_leads_count');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('crawl_jobs', function (Blueprint $table) {
            $table->dropColumn([
                'category',
                'filters_used',
                'new_leads_count',
                'duplicate_leads_count',
                'error_count'
            ]);
        });
    }
};
