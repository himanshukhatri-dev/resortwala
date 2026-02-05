<?php

require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Http;

echo "--- GEMINI CONNECTIVITY DIAGNOSTIC ---\n";

$key = env('GOOGLE_API_KEY');
echo "API Key Length: " . strlen($key) . "\n";
echo "API Key First 4: " . substr($key, 0, 4) . "\n";
echo "API Key Last 4: " . substr($key, -4) . "\n";

$url = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key={$key}";

$geminiHistory = [
    [
        'role' => 'user',
        'parts' => [['text' => "Hello, are you online?"]]
    ]
];

echo "Sending Request to: https://generativelanguage.googleapis.com/...\n";

try {
    $response = Http::withHeaders(['Content-Type' => 'application/json'])
        ->withOptions(['verify' => false])
        ->post($url, [
            'contents' => $geminiHistory,
            'generationConfig' => [
                'temperature' => 0.7,
                'maxOutputTokens' => 100,
            ]
        ]);

    echo "Status Code: " . $response->status() . "\n";
    echo "Body Preview:\n";
    print_r($response->json());

    if ($response->successful()) {
        echo "\n[SUCCESS] Response: " . $response->json('candidates.0.content.parts.0.text') . "\n";
    } else {
        echo "\n[FAILURE] see JSON above.\n";
    }

} catch (\Exception $e) {
    echo "\n[EXCEPTION] " . $e->getMessage() . "\n";
}
