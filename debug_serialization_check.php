<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Customer;

echo "Checking Customer Serialization...\n";
try {
    $c = Customer::first();
    if (!$c)
        die("No customer found");
    echo "Customer ID: " . $c->id . "\n";
    echo "JSON: " . $c->toJson() . "\n";
    echo "DONE";
} catch (\Throwable $e) {
    echo "ERROR: " . $e->getMessage();
    echo "\n" . $e->getTraceAsString();
}
