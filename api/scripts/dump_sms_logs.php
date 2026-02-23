<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\NotificationLog;

$logs = NotificationLog::where('channel', 'sms')
    ->latest()
    ->limit(5)
    ->get();

echo "ID | Recipient | Provider Response | Content Snapshot\n";
echo str_repeat("-", 100) . "\n";
foreach ($logs as $log) {
    echo "{$log->id} | {$log->recipient} | {$log->provider_id} | " . substr($log->content, 0, 50) . "\n";
}
