<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$userId = 1;
$title = "ResortWala Alert";
$body = "Second Test: Checking if this pops up on your browser!";

try {
    $fcm = app(\App\Services\FCMService::class);
    
    // Fetch token from Customer Model
    $customer = \App\Models\Customer::find($userId);
    
    if (!$customer) {
         die("Error: Customer ID $userId not found.\n");
    }
    
    echo "Customer Name: {$customer->name}\n";
    
    if (!$customer->fcm_token) {
        die("Error: Customer ID $userId has NO registered device token (fcm_token column).\n");
    }

    $token = $customer->fcm_token;
    echo "Found Token: " . substr($token, 0, 20) . "...\n";

    // Use low-level sendToTokens
    echo "Sending notification via FCMService::sendToTokens...\n";
    $result = $fcm->sendToTokens([$token], $title, $body, ['type' => 'test']);
    
    echo "Notification Dispatch Result:\n";
    print_r($result);

} catch (\Exception $e) {
    echo "Error sending notification: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}
