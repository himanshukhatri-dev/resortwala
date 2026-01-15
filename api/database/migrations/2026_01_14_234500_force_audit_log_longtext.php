<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Force all potentially large columns to LONGTEXT (4GB limit)
        // This covers JSON payloads that exceed 64KB (TEXT limit)
        
        $table = 'audit_logs';

        // Use raw ALTER to ensure type change works across MariaDB/MySQL versions
        DB::statement("ALTER TABLE `{$table}` MODIFY `user_agent` LONGTEXT NULL");
        DB::statement("ALTER TABLE `{$table}` MODIFY `url` LONGTEXT NULL");
        DB::statement("ALTER TABLE `{$table}` MODIFY `new_values` LONGTEXT NULL");
        DB::statement("ALTER TABLE `{$table}` MODIFY `old_values` LONGTEXT NULL");
    }

    public function down(): void
    {
        // No down needed really, but we can revert to TEXT
        $table = 'audit_logs';
        DB::statement("ALTER TABLE `{$table}` MODIFY `user_agent` TEXT NULL");
        DB::statement("ALTER TABLE `{$table}` MODIFY `url` TEXT NULL");
        // new/old values were JSON or TEXT originally, acceptable to leave as LONGTEXT or revert to JSON
    }
};
