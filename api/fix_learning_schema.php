<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- RESETTING LEARNING SCHEMA ---\n";

try {
    // Disable foreign key checks to allow arbitrary drop order
    DB::statement('SET FOREIGN_KEY_CHECKS=0;');

    $tables = ['vendor_learning_progress', 'learning_steps', 'learning_modules'];

    foreach ($tables as $table) {
        if (Schema::hasTable($table)) {
            Schema::drop($table);
            echo "Dropped table: $table\n";
        } else {
            echo "Table not found (skipping): $table\n";
        }
    }

    // Reset migration entry
    $migrationName = '2026_02_02_120000_create_learning_tables';
    $deleted = DB::table('migrations')->where('migration', $migrationName)->delete();

    if ($deleted) {
        echo "Removed migration entry for: $migrationName\n";
    } else {
        echo "Migration entry not found for: $migrationName\n";
    }

    DB::statement('SET FOREIGN_KEY_CHECKS=1;');

    echo "Done. You can now run 'php artisan migrate'.\n";

} catch (\Exception $e) {
    echo "\n[EXCEPTION] " . $e->getMessage() . "\n";
}
