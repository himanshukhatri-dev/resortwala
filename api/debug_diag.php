<?php
// debug_diag.php - Diagnose SMS & Payment Issues within App Context
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Log;
use App\Services\NotificationEngine;
use PhonePe\payments\v2\standardCheckout\StandardCheckoutClient;
use PhonePe\Env;

echo "\n====== SMS DIAGNOSIS ======\n";
try {
    echo "Testing NotificationEngine Dispatch...\n";
    $engine = app(NotificationEngine::class);
    
    // Simulate CustomerAuthController call
    $mobile = '919011559897'; // Use a test number
    $otp = 'AUTO123';
    
    // We expect this to use the Hardcoded API Key & Entity ID we added
    $result = $engine->dispatch('otp.sms', ['mobile' => $mobile], ['otp' => $otp]);
    
    echo "Dispatch Result: " . ($result ? "TRUE" : "FALSE") . "\n";
    echo "Check logs for 'SMS Response'\n";

} catch (\Exception $e) {
    echo "SMS Exception: " . $e->getMessage() . "\n";
}

echo "\n====== PAYMENT DIAGNOSIS ======\n";
try {
    echo "Testing PhonePe Client Init...\n";
    
    $clientId = config('phonepe.merchant_id') ?? env('PHONEPE_MERCHANT_ID');
    $clientSecret = config('phonepe.salt_key') ?? env('PHONEPE_SALT_KEY');
    $envVal = Env::PRODUCTION; // Check what this is
    
    echo "Env::PRODUCTION value type: " . gettype($envVal) . "\n";
    echo "Env::PRODUCTION value: " . print_r($envVal, true) . "\n";
    
    // Try Init
    $client = StandardCheckoutClient::getInstance(
        $clientId, 
        1, 
        $clientSecret, 
        $envVal
    );
    echo "Client Init Success class: " . get_class($client) . "\n";

} catch (\Exception $e) {
    echo "Payment Exception: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}

echo "\n====== RECENT LOGS (Last 20) ======\n";
$logFile = storage_path('logs/laravel-'.date('Y-m-d').'.log');
if (!file_exists($logFile)) {
    $logFile = storage_path('logs/laravel.log');
}
if (file_exists($logFile)) {
    echo "Reading: $logFile\n";
    $lines = array_slice(file($logFile), -20);
    foreach ($lines as $line) {
        echo $line;
    }
} else {
    echo "No Log File Found.\n";
}
