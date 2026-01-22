<?php
// fix_sms_final.php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\NotificationTrigger;
use App\Models\NotificationTemplate;
use App\Models\DltRegistry;
use Illuminate\Support\Facades\Log;

echo "--- START SMS FIX ---\n";

// 1. Find the OTP Trigger
$trigger = NotificationTrigger::where('event_name', 'otp.sms')->first();
if (!$trigger) {
    die("Error: Trigger 'otp.sms' not found.\n");
}

echo "Found Trigger: {$trigger->event_name}\n";
echo "Linked SMS Template ID: {$trigger->sms_template_id}\n";

// 2. Find the Template
$template = NotificationTemplate::find($trigger->sms_template_id);
if (!$template) {
    die("Error: Template ID {$trigger->sms_template_id} not found.\n");
}

echo "Current Template Content: {$template->content}\n";

// 3. Update Content to MATCH the WORKING test script
// Working Text: "Your ResortWala verification code is: {otp}. Valid for 10 minutes."
// We use {{otp}} for variable replacement.
$newContent = "Your ResortWala verification code is: {{otp}}. Valid for 10 minutes.";
$template->content = $newContent;
$template->save();

echo "UPDATED Template Content to: {$template->content}\n";

// 4. Ensure DLT Registry Matches
// DLT Content uses {#var#}
$dltContentKey = "Your ResortWala verification code is: {#var#}. Valid for 10 minutes.";
$dltTemplateId = '1007469695624158431'; 

// Check if exists
$registry = DltRegistry::where('template_id', $dltTemplateId)->first();
if (!$registry) {
    $registry = new DltRegistry();
    $registry->template_id = $dltTemplateId;
    $registry->sender_id = 'ResWla';
    $registry->entity_id = '1001569562865275631';
    echo "Creating NEW DLT Registry entry...\n";
} else {
    echo "Updating EXISTING DLT Registry entry...\n";
}

$registry->approved_content = $dltContentKey;
$registry->save();

echo "DLT Registry Saved: ID={$registry->template_id}, Content={$registry->approved_content}\n";
echo "--- SUCCESS: PLEASE RETRY SMS NOW ---\n";
