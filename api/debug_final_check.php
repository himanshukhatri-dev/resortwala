<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\NotificationTrigger;
use App\Models\NotificationTemplate;

echo "--- FINAL DEBUG CHECK ---\n";
$trigger = NotificationTrigger::where('event_name', 'otp.sms')->first();
echo "Trigger ID: " . ($trigger->id ?? 'NULL') . "\n";
echo "Linked Template ID: " . ($trigger->sms_template_id ?? 'NULL') . "\n";

if ($trigger && $trigger->sms_template_id) {
    $template = NotificationTemplate::find($trigger->sms_template_id);
    echo "Template ID: " . ($template->id ?? 'NULL') . "\n";
    echo "DB Content: " . ($template->content ?? 'NULL') . "\n";
}

echo "--- CONTROLLER CHECK ---\n";
// Read the Controller file to see if it uses old logic
$controller = file_get_contents(__DIR__ . '/app/Http/Controllers/CustomerAuthController.php');
if (strpos($controller, 'NotificationService::class') !== false) {
    echo "WARNING: Controller still references OLD NotificationService!\n";
} else {
    echo "OK: Controller looks clean.\n";
}

if (strpos($controller, "dispatch('otp.sms'") !== false) {
    echo "OK: Controller uses dispatch('otp.sms')\n";
} else {
    echo "WARNING: Controller NOT using dispatch!\n";
}
