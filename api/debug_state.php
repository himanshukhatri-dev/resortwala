<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\NotificationTrigger;
use App\Models\NotificationTemplate;

echo "--- DEBUG STATE ---\n";
$trigger = NotificationTrigger::where('event_name', 'otp.sms')->first();
echo "Trigger ID: " . ($trigger->id ?? 'NULL') . "\n";
echo "Trigger SMS Template ID: " . ($trigger->sms_template_id ?? 'NULL') . "\n";

if ($trigger && $trigger->sms_template_id) {
    $template = NotificationTemplate::find($trigger->sms_template_id);
    echo "Template ID: " . ($template->id ?? 'NULL') . "\n";
    echo "Template Content: " . ($template->content ?? 'NULL') . "\n";

    // Check DLT
    // Logic: 15 chars of normalized content
    $normalizedContent = preg_replace('/\{\{[^}]+\}\}/', '{#var#}', $template->content);
    $search = substr($normalizedContent, 0, 15);
    echo "DLT Search Key: $search\n";

    $registry = \App\Models\DltRegistry::where('sender_id', 'ResWla')
        ->where('approved_content', 'LIKE', $search . '%')
        ->first();
    
    echo "DLT Registry Found: " . ($registry ? 'YES' : 'NO') . "\n";
    if ($registry) {
        echo "DLT Template ID: " . $registry->template_id . "\n";
        echo "DLT Content: " . $registry->approved_content . "\n";
    }
} else {
    echo "No details found.\n";
}
