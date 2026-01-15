<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Use raw SQL to avoid doctrine/dbal dependency
        // Fix user_agent length (varchar(255) -> text)
        DB::statement('ALTER TABLE audit_logs MODIFY user_agent TEXT NULL');
        
        // Fix url length (text is 64kb, usually enough, but let's be safe with mediumtext)
        DB::statement('ALTER TABLE audit_logs MODIFY url MEDIUMTEXT NULL');
        
        // Ensure old/new values can hold large JSON (json type is usually fine, but explicit LONGTEXT for safety if using text-based json storage)
        // In valid MySQL JSON columns, size is large. If it was created as json, it should be fine.
        // But if they are using MariaDB with alias, it might be LONGTEXT already.
        // We will just leave new/old values alone if they are already JSON type, as JSON type supports valid JSON up to 1GB.
        // The most likely culprit is user_agent.
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE audit_logs MODIFY user_agent VARCHAR(255) NULL');
        DB::statement('ALTER TABLE audit_logs MODIFY url TEXT NULL');
    }
};
