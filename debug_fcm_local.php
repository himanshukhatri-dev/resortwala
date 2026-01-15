<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\UserDeviceToken;
use App\Services\FCMService;
use Illuminate\Support\Facades\Log;

echo "--- FCM DEBUGGER ---\n";

// 1. Check Model
if (!class_exists(UserDeviceToken::class)) {
    echo "CRITICAL: App\Models\UserDeviceToken class not found!\n";
    exit(1);
}

// 2. Check Tokens
$count = UserDeviceToken::count();
echo "Total Device Tokens in DB: $count\n";

if ($count > 0) {
    $latest = UserDeviceToken::latest()->first();
    echo "Latest Token: " . substr($latest->device_token, 0, 20) . "... (User: {$latest->user_id})\n";
    
    // 3. Test Send
    echo "Attempting to send test to latest token...\n";
    
    try {
        $fcm = app(FCMService::class);
        $result = $fcm->sendToTokens([$latest->device_token], "Test Notification", "This is a debug message from server.");
        
        echo "Send Result:\n";
        print_r($result);
        
        if (($result['success'] ?? 0) > 0) {
           echo "SUCCESS: Message sent to FCM.\n";
        } else {
           echo "FAILURE: FCM rejected the message.\n";
           if (isset($result['error'])) {
               echo "Error Details: " . $result['error'] . "\n";
           }
        }
    } catch (\Exception $e) {
        echo "EXCEPTION: " . $e->getMessage() . "\n";
    }

} else {
    echo "WARNING: No device tokens found. The mobile app is likely not registering them.\n";
}

echo "Done.\n";
