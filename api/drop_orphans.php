<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$orphans = ['user_events', 'bookings', 'holidays', 'users'];
foreach ($orphans as $table) {
    try {
        DB::statement("DROP TABLE IF EXISTS `$table`");
        echo "Dropped: $table\n";
    } catch (\Exception $e) {
        echo "Error dropping $table: " . $e->getMessage() . "\n";
    }
}
