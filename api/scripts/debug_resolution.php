<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Services\NotificationEngine;

$engine = new NotificationEngine();

$content = "Dear {{customer_name}}, Your stay at {{property_name}} on {{check_in}} has been confirmed.";
$data = [
    'customer_name' => 'Himanshu',
    'property_name' => 'Palm Resort',
    'check_in' => '2026-02-14'
];

// Reflect to access protected method
$method = new ReflectionMethod($engine, 'resolveVariables');
$method->setAccessible(true);

$resolved = $method->invoke($engine, $content, $data);

echo "Original: $content\n";
echo "Data Keys: " . implode(', ', array_keys($data)) . "\n";
echo "Resolved: $resolved\n";

if ($resolved === "Dear Himanshu, Your stay at Palm Resort on 2026-02-14 has been confirmed.") {
    echo "SUCCESS: Resolution works in isolation.\n";
} else {
    echo "FAILURE: Resolution failed.\n";
}
