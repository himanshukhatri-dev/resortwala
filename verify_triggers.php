<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- Verifying OTP Trigger ---\n";

$trigger = App\Models\NotificationTrigger::where('event_name', 'otp.sms')
    ->with('smsTemplate')
    ->first();

if ($trigger) {
    echo "Trigger Found: otp.sms\n";
    echo "Active: " . ($trigger->is_active ? 'YES' : 'NO') . "\n"; // Also fixed active -> is_active based on model
    if ($trigger->smsTemplate) {
        echo "Template Name: " . $trigger->smsTemplate->name . "\n";
        echo "Template Content: " . $trigger->smsTemplate->content . "\n";
    } else {
        echo "ERROR: Trigger has no SMS template attached!\n";
    }
} else {
    echo "ERROR: Trigger 'otp.sms' not found!\n";
}
