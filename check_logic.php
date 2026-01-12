<?php
require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Checking Classes...\n";

try {
    $export = new \App\Exports\PropertyTemplateExport;
    echo "Export Instantiated: YES\n";
} catch (\Throwable $e) {
    echo "Export Error: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}

try {
    echo "Controller Instantiated: YES\n";

    echo "Testing Excel Store...\n";
    try {
        \Maatwebsite\Excel\Facades\Excel::store(new \App\Exports\PropertyTemplateExport, 'test_export.xlsx');
        echo "Excel Store: SUCCESS\n";
    } catch (\Throwable $e) {
        echo "Excel Store FAILED: " . $e->getMessage() . "\n";
    }
} catch (\Throwable $e) {
    echo "Controller Error: " . $e->getMessage() . "\n";
}
