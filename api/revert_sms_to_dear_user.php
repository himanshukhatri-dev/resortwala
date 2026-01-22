<?php
// revert_sms_to_dear_user.php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\NotificationTrigger;
use App\Models\NotificationTemplate;
use App\Models\DltRegistry;

echo "--- REVERTING SMS TO 'DEAR USER' ---\n";

// 1. Define Correct Data
$templateId = '1707176886644052410'; // The ID seen in logs for "Dear User"
$contentApp = "Dear User, {{otp}} is your OTP for login at ResortWala. Valid for 10 mins. Do not share. - ResortWala";
$contentDLT = "Dear User, {#var#} is your OTP for login at ResortWala. Valid for 10 mins. Do not share. - ResortWala";

// 2. Update Notification Template (ID 6 for otp.sms)
$trigger = NotificationTrigger::where('event_name', 'otp.sms')->first();
if ($trigger) {
    if ($trigger->sms_template_id) {
         $template = NotificationTemplate::find($trigger->sms_template_id);
         if ($template) {
             $template->content = $contentApp;
             $template->save();
             echo "Updated Notification Template ID {$template->id}\n";
         }
    }
}

// 3. Update DLT Registry
$registry = DltRegistry::where('template_id', $templateId)->first();
if (!$registry) {
    $registry = new DltRegistry();
    $registry->template_id = $templateId;
    $registry->sender_id = 'ResWla';
    $registry->entity_id = '1001569562865275631';
    echo "Creating NEW DLT Entry for $templateId\n";
} else {
    echo "Updating EXISTING DLT Entry for $templateId\n";
}

$registry->approved_content = $contentDLT;
$registry->save();
echo "DLT Registry Saved.\n";
