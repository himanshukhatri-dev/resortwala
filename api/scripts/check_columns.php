<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;

$tables = ['notification_templates', 'notification_triggers'];

foreach ($tables as $table) {
    if (Schema::hasTable($table)) {
        echo "Table: $table\n";
        $columns = Schema::getColumnListing($table);
        foreach ($columns as $column) {
            echo " - $column\n";
        }
    } else {
        echo "Table $table does not exist.\n";
    }
}
