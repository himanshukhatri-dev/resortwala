<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\NotificationLog;

$logs = NotificationLog::where('event_name', 'like', 'booking.confirmed%')
    ->latest()
    ->limit(10)
    ->get();

echo "ID | Channel | Status | Recipient | Subject/Error\n";
echo str_repeat("-", 80) . "\n";
foreach ($logs as $log) {
    $err = $log->error_message ? substr($log->error_message, 0, 40) : 'None';
    $msg = $log->channel === 'email' ? $log->subject : $err;
    echo "{$log->id} | {$log->channel} | {$log->status} | {$log->recipient} | $msg\n";
}
