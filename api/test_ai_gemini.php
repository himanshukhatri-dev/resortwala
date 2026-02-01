<?php

use App\Services\AIAssistantService;
use Illuminate\Support\Facades\Log;

require __DIR__ . '/vendor/autoload.php';

$app = require __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$kernel->bootstrap();

echo "Testing AI Assistant Service with Gemini...\n";
echo "Google Key Present: " . (env('GOOGLE_API_KEY') ? 'Yes' : 'No') . "\n";
echo "OpenAI Key Present: " . (config('services.openai.api_key') ? 'Yes' : 'No') . "\n\n";

try {
    $service = new AIAssistantService(); // Manual instantiation to test

    $vendorId = 999; // Dummy vendor
    $sessionId = 'test-session-' . time();
    $message = "Hello! Briefly tell me what you can do.";

    echo "Sending Message: $message\n";

    $response = $service->generateResponse($vendorId, $message, $sessionId);

    echo "\n--- Response ---\n";
    echo $response['message'];
    echo "\n----------------\n";

    if (strpos($response['message'], 'simulated AI') !== false) {
        echo "\n[FAIL] Still using Simulated AI.\n";
    } elseif (strpos($response['message'], 'trouble connecting2') !== false) {
        echo "\n[FAIL] Connection Error.\n";
    } else {
        echo "\n[SUCCESS] Response received from AI Provider.\n";
    }

} catch (Exception $e) {
    echo "\n[ERROR] " . $e->getMessage() . "\n";
    Log::error($e);
}
