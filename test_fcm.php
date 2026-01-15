<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$tokens = App\Models\UserDeviceToken::where('user_id', 1)->pluck('device_token')->toArray();
foreach ($tokens as $t) {
    echo "Token: " . substr($t, 0, 10) . "..." . substr($t, -10) . "\n";
    // echo "Full Token: " . $t . "\n"; // Uncomment if needed, but might spam
}

$fcm = app(App\Services\FCMService::class);
if (count($tokens) > 0) {
    // Modify FCM Service to return error temporarily or we assume we read logs.
    // For now, let's just re-run and trust the log analysis.
    // But I want to check credentials validity too.
    
    // Check if service account exists
    $sa = storage_path('app/firebase_service_account.json');
    echo "Service Account Path: $sa \n";
    echo "Exists: " . (file_exists($sa) ? 'YES' : 'NO') . "\n";
    
    $res = $fcm->sendToTokens($tokens, "Test", "From Script");
    print_r($res);
}
