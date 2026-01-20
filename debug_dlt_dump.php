<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- DLT Registries ---\n";
$dlts = App\Models\DltRegistry::all();
foreach ($dlts as $dlt) {
    echo "ID: {$dlt->template_id} | Sender: {$dlt->sender_id}\n";
    echo "Content: {$dlt->approved_content}\n";
    echo "--------------------------\n";
}

echo "\n--- Notification Templates (SMS) ---\n";
$templates = App\Models\NotificationTemplate::where('channel', 'sms')->get();
foreach ($templates as $t) {
    echo "ID: {$t->id} | Name: {$t->name}\n";
    echo "Content: {$t->content}\n";
    echo "Active: " . ($t->is_active ? 'YES' : 'NO') . "\n";
    echo "--------------------------\n";
}
