<?php

use App\Models\NotificationTemplate;
use App\Models\DltRegistry;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- Debugging Content HEX ---\n";

// 1. Get Generated Content
$tplName = 'sms_auth_otp';
$template = NotificationTemplate::where('name', $tplName)->first();
$content = $template->content;
$content = str_replace("{{otp}}", '123456', $content);
$content = str_replace("{{ otp }}", '123456', $content);

echo "Generated: $content\n";
echo "Hex: " . bin2hex($content) . "\n\n";

// 2. Get DLT Registry Content
$senderId = 'ResWla'; // Hardcoded for check
$registry = DltRegistry::where('sender_id', $senderId)
    ->where('template_id', '1707176886644052410')
    ->first();

if ($registry) {
    echo "DLT Registry: " . $registry->approved_content . "\n";
    echo "Hex: " . bin2hex($registry->approved_content) . "\n";
} else {
    echo "Registry not found for '1707176886644052410'\n";
}
