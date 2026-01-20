<?php

use App\Models\NotificationTemplate;
use App\Models\DltRegistry;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- DLT Lookup Debug ---\n";

$tplName = 'sms_admin_login_alert';
$template = NotificationTemplate::where('name', $tplName)->first();

if (!$template) die("Template '{$tplName}' not found.\n");

echo "Template Content (Start): " . substr($template->content, 0, 40) . "...\n";

$senderId = config('services.sms.sender_id') ?? env('SMS_SENDER_ID', 'ResWla');
echo "Sender ID: $senderId\n";

$search = substr($template->content, 0, 15);
echo "Search Term (Prefix): '$search'\n";

$registry = DltRegistry::where('sender_id', $senderId)
    ->where('approved_content', 'LIKE', $search . '%')
    ->first();

if ($registry) {
    echo "SUCCESS: Found DLT Entry!\n";
    echo "ID: " . $registry->template_id . "\n";
    echo "Content: " . $registry->approved_content . "\n";
} else {
    echo "FAILURE: No DLT Entry found matching '$search%'.\n";
    echo "Dumping all entries for sender '$senderId':\n";
    foreach(DltRegistry::where('sender_id', $senderId)->get() as $r) {
        echo "- [{$r->template_id}] " . substr($r->approved_content, 0, 30) . "...\n";
    }
}
