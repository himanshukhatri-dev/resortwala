<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->bootstrap();

use App\Models\SystemSetting;

$settings = SystemSetting::current();
$settings->update([
    'system_locked_until' => '2026-01-27 00:00:00' // Lock until Jan 27th midnight
]);

echo "System locked until: " . $settings->system_locked_until . "\n";
