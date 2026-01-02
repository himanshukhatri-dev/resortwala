<?php
// reset_db_robust.php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "Starting Robust DB Wipe...\n";
DB::statement('SET FOREIGN_KEY_CHECKS=0;');

// Hardcoded list to ensure even "invisible" orphan tables are dropped
$tables = [
    'purchased_coupons', 'property_videos', 'otps', 'onboarding_tokens', 'property_edit_requests',
    'wishlists', 'property_holidays', 'property_images', 'property_masters', 'holidays', 'bookings',
    'customers', 'coupons', 'personal_access_tokens', 'user_events', 'users', 'jobs', 'failed_jobs',
    'cache', 'cache_locks', 'job_batches', 'migrations', 'password_reset_tokens', 'sessions'
];

echo "Hard dropping " . count($tables) . " tables blindly.\n";
foreach ($tables as $tableName) {
    try {
        DB::statement("DROP TABLE IF EXISTS `$tableName`");
        echo "Dropped (if existed): $tableName\n";
    } catch (\Exception $e) {
        echo "Failed to drop $tableName: " . $e->getMessage() . "\n";
    }
}

// Drop Views (manually if needed, but usually tables covers it or specific drop view command)
// $views = DB::select("SHOW FULL TABLES WHERE Table_Type = 'VIEW'"); ...

DB::statement('SET FOREIGN_KEY_CHECKS=1;');
echo "DB Wipe Complete.\n";
