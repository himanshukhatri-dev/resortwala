<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$customer = App\Models\Customer::find(1);
if ($customer) {
    echo "Customer ID: {$customer->id}\n";
    echo "FCM Token: " . ($customer->fcm_token ? substr($customer->fcm_token, 0, 20) . "..." : "NULL") . "\n";
} else {
    echo "Customer not found.\n";
}
