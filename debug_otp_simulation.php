<?php

use App\Models\NotificationTemplate;
use Illuminate\Support\Facades\Http;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- Debugging OTP DLT Content ---\n";

// 1. Get Template
$tplName = 'sms_auth_otp';
$template = NotificationTemplate::where('name', $tplName)->first();

if (!$template) die("Template '$tplName' not found.\n");

// 2. Resolve with Dummy OTP
$otp = '123456';
$content = $template->content;
$content = str_replace("{{otp}}", $otp, $content);
$content = str_replace("{{ otp }}", $otp, $content);

echo "--------------------------------------------------\n";
echo "EXACT CONTENT BEING SENT (Copy & Check in DLT):\n";
echo "--------------------------------------------------\n";
echo trim($content) . "\n";
echo "--------------------------------------------------\n";
echo "Length: " . strlen($content) . " chars\n\n";

// 3. Compare with DLT Registry
$senderId = config('services.sms.sender_id') ?? env('SMS_SENDER_ID', 'ResWla');
$registry = \App\Models\DltRegistry::where('sender_id', $senderId)
    ->where('template_id', '1707176886644052410')
    ->first();

if ($registry) {
    echo "Stored DLT Approved Content:\n";
    echo $registry->approved_content . "\n";
    
    // Simple check
    $approved = $registry->approved_content;
    $approvedRegex = preg_quote($approved, '/');
    $approvedRegex = str_replace('\{\#var\#\}', '.*', $approvedRegex);
    
    if (preg_match('/^' . $approvedRegex . '$/', $content)) {
        echo "MATCH: Logic suggests this content IS valid against stored pattern.\n";
    } else {
        echo "MISMATCH: The content generated does not match the stored DLT pattern.\n";
    }
} else {
    echo "Warning: No Registry found for this Template ID locally.\n";
}
