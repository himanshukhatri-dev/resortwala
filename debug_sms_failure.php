<?php

// Fix for console
if (session_status() === PHP_SESSION_NONE) {
    // session_start(); 
}

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- Debugging SMS Failure (Login Flow) ---\n";

$svc = app(\App\Services\NotificationService::class);
$otp = "123456"; // Dummy OTP

// 1. Test with 10 digit number (User input likely)
try {
    echo "\nTest 1: '9870646548' (10 digits)\n";
    $svc->sendSMSOTP('9870646548', $otp, 'login');
    echo "  [SUCCESS] Method returned.\n";
} catch (\Exception $e) {
    echo "  [FAIL] " . $e->getMessage() . "\n";
}

// 2. Test with 12 digit number (Backend Normalized)
try {
    echo "\nTest 2: '919870646548' (12 digits)\n";
    $svc->sendSMSOTP('919870646548', $otp, 'login');
    echo "  [SUCCESS] Method returned.\n";
} catch (\Exception $e) {
    echo "  [FAIL] " . $e->getMessage() . "\n";
}

// 3. Test with +91 format
try {
    echo "\nTest 3: '+919870646548'\n";
    $svc->sendSMSOTP('+919870646548', $otp, 'login');
    echo "  [SUCCESS] Method returned.\n";
} catch (\Exception $e) {
    echo "  [FAIL] " . $e->getMessage() . "\n";
}

// Check Logs for the last few attempts
echo "\n--- Recent Log Entries (Tail) ---\n";
// We can't easily tail logs from PHP script without exec
echo "Please check /var/www/html/api.resortwala.com/storage/logs/laravel.log manually or via separate command.\n";
