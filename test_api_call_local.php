<?php
use Illuminate\Support\Facades\Http;
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$token = "176|bVFbvdYK3WUxugKFLMN16618ed4Xbd37shX5rtBgN"; 

try {
    $response = Http::withoutVerifying()->withToken($token)->post('http://localhost/api/notifications/token', [
        'device_token' => 'api_test_token_888',
        'platform' => 'android'
    ]);

    echo "Status: " . $response->status() . "\n";
    echo "Body: " . $response->body() . "\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
