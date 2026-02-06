<?php

use Illuminate\Support\Facades\Http;

require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$apiKey = env('GOOGLE_API_KEY');
echo "Testing connectivity with key ending in: " . substr($apiKey, -4) . "\n";

$modelsToTest = [
    'models/gemini-1.5-flash',
    'models/gemini-pro',
    'models/gemini-1.0-pro'
];

foreach ($modelsToTest as $model) {
    echo "--- Testing Model: $model ---\n";
    $url = "https://generativelanguage.googleapis.com/v1beta/{$model}:generateContent?key=" . $apiKey;

    try {
        $response = Http::withHeaders(['Content-Type' => 'application/json'])
            ->withOptions(['verify' => false])
            ->post($url, [
                'contents' => [
                    ['role' => 'user', 'parts' => [['text' => 'Hi']]]
                ]
            ]);

        echo "Status: " . $response->status() . "\n";
        if ($response->successful()) {
            echo "SUCCESS: " . $response->json('candidates.0.content.parts.0.text') . "\n";
            exit(0); // Found it!
        } else {
            echo "FAILED: ";
            print_r($response->json());
        }
    } catch (\Exception $e) {
        echo "EXCEPTION: " . $e->getMessage() . "\n";
    }
}
