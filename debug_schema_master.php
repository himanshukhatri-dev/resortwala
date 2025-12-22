<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;

try {
    $columns = Schema::getColumnListing('property_masters');
    echo "Columns in property_masters:\n";
    foreach ($columns as $col) {
        echo "- $col\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
