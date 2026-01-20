<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- Recent Notification Logs ---\n";

$logs = App\Models\NotificationLog::orderBy('created_at', 'desc')->take(5)->get();

foreach ($logs as $l) {
    echo "ID: {$l->id} | Type: {$l->channel} | Recipient: {$l->recipient}\n";
    echo "Status: {$l->status}\n";
    echo "Message: {$l->message}\n";
    echo "Error (JSON): " . json_encode($l->error) . "\n";
    echo "Time: {$l->created_at}\n";
    echo "--------------------------\n";
}
