<?php

use Illuminate\Support\Facades\Http;

require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$apiKey = env('GOOGLE_API_KEY');
echo "Checking models for API Key ending in: " . substr($apiKey, -4) . "\n";

$url = "https://generativelanguage.googleapis.com/v1beta/models?key=" . $apiKey;

$response = Http::get($url);

echo "Status: " . $response->status() . "\n";
if ($response->successful()) {
    $models = $response->json('models');
    foreach ($models as $model) {
        // Only show models that support generateContent
        if (in_array('generateContent', $model['supportedGenerationMethods'])) {
            echo $model['name'] . "\n";
        }
    }
} else {
    echo "Error: ";
    print_r($response->json());
}
