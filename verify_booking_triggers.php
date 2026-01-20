<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- Verifying Booking Notification Triggers ---\n";

$events = [
    'booking.confirmed_customer',
    'booking.new_request_vendor',
    'auth.admin_login' // Checking this as well since we have a DLT ID for it
];

foreach ($events as $event) {
    echo "\nChecking Event: $event\n";
    $trigger = App\Models\NotificationTrigger::where('event_name', $event)
        ->with(['smsTemplate', 'emailTemplate'])
        ->first();

    if ($trigger) {
        echo "  [OK] Trigger Found.\n";
        echo "  Active: " . ($trigger->is_active ? 'YES' : 'NO') . "\n";
        
        if ($trigger->smsTemplate) {
            echo "  [SMS] Template: " . $trigger->smsTemplate->name . "\n";
            echo "        Content: " . $trigger->smsTemplate->content . "\n";
            // Check DLT mapping via the template (assuming logic exists, or we check DltRegistry manually)
            // But NotificationEngine does lookup by content.
            // Let's check `dlt_registries` for this content/template match if possible.
        } else {
            echo "  [SMS] WARNING: No SMS Template attached.\n";
        }

        if ($trigger->emailTemplate) {
             echo "  [EMAIL] Template: " . $trigger->emailTemplate->name . "\n";
        }

    } else {
        echo "  [FAIL] Trigger NOT FOUND in DB.\n";
    }
}
