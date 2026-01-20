<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- DLT Content Fetch ---\n";
$ids = ['1707176886664943347', '1707176886656656974', '1707176886673745125'];
$regs = App\Models\DltRegistry::whereIn('template_id', $ids)->get();

foreach($regs as $r) { 
    echo "ID: {$r->template_id}\n";
    echo "CONTENT: {$r->approved_content}\n";
    echo "--------------------------\n";
}

echo "\n--- Trigger Check: admin.login ---\n";
$trigger = App\Models\NotificationTrigger::where('event_name', 'admin.login')->first();
if ($trigger) {
    echo "[OK] 'admin.login' found.\n";
    echo "SMS Template ID: " . $trigger->sms_template_id . "\n";
} else {
    echo "[FAIL] 'admin.login' NOT found.\n";
}

echo "\n--- Trigger Check: booking.new_request_vendor ---\n";
$trigger = App\Models\NotificationTrigger::where('event_name', 'booking.new_request_vendor')->first();
if ($trigger) {
    echo "[OK] 'booking.new_request_vendor' found.\n";
    echo "SMS Template ID: " . ($trigger->sms_template_id ?? 'NULL') . "\n";
} else {
    echo "[FAIL] 'booking.new_request_vendor' NOT found.\n";
}
