<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('video_render_jobs', function (Blueprint $table) {
            // 1. Drop FK
            $table->dropForeign(['property_id']);
            
            // 2. Modify Column to be Nullable
            $table->unsignedBigInteger('property_id')->nullable()->change();
            
            // 3. Re-Add FK (Optional: if you still want to enforce it WHEN not null)
            // But if it's nullable, and we want to allow nulls, checking against master is fine for non-nulls.
            // However, typical 'foreignId()->nullable()->constrained()' does this.
            // We manually add it back.
            $table->foreign('property_id')->references('PropertyId')->on('property_masters')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('video_render_jobs', function (Blueprint $table) {
            $table->dropForeign(['property_id']);
            $table->unsignedBigInteger('property_id')->nullable(false)->change();
            $table->foreign('property_id')->references('PropertyId')->on('property_masters')->onDelete('cascade');
        });
    }
};
