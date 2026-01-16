<?php

// CONFIG
$baseUrl = 'https://www.resortwala.com/api';
$email = 'admin@resortwala.com';
$password = 'admin123';
$propertyId = 36; // Known existing property

function call($method, $url, $data = [], $token = null) {
    global $baseUrl;
    $ch = curl_init($baseUrl . $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // For local test convenience
    
    $headers = ['Content-Type: application/json', 'Accept: application/json'];
    if ($token) $headers[] = "Authorization: Bearer $token";
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    if (!empty($data)) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return ['code' => $httpCode, 'body' => json_decode($response, true)];
}

echo "--- STARTING VOICE STUDIO E2E TEST ---\n";

// 1. LOGIN
echo "1. Logging in...\n";
$login = call('POST', '/admin/login', ['email' => $email, 'password' => $password]);
if ($login['code'] !== 200) die("LOGIN FAILED: " . json_encode($login));
$token = $login['body']['token'];
echo "   [OK] Token acquired.\n";

// 2. GENERATE AUDIO
echo "2. Generating Audio (Voice Studio)...\n";
$audioPayload = [
    'script_text' => 'This is a test script for the voice studio end to end verification.',
    'voice_id' => 'cinematic_male',
    'language' => 'en',
    'title' => 'E2E Test Project ' . time()
];
$audioRes = call('POST', '/admin/voice-studio/generate-audio', $audioPayload, $token);
if ($audioRes['code'] !== 200) die("AUDIO FAILED: " . json_encode($audioRes));
$projectId = $audioRes['body']['project']['id'];
echo "   [OK] Audio Generated. Project ID: $projectId\n";

// 3. RENDER VIDEO
echo "3. Triggering Video Render...\n";
$renderPayload = [
    'visual_type' => 'cinematic',
    'visual_options' => [
        'property_id' => $propertyId,
        'media_ids' => [1, 2, 3] // Mock IDs, just needs to be array
    ]
];
$renderRes = call('POST', "/admin/voice-studio/projects/$projectId/render", $renderPayload, $token);
if ($renderRes['code'] !== 200) die("RENDER FAILED: " . json_encode($renderRes));
$jobId = $renderRes['body']['job_id'];
echo "   [OK] Render Job Started. Job ID: $jobId\n";

// 4. POLL STATUS
echo "4. Polling Status (5s)...\n";
sleep(5);
$statusRes = call('GET', "/admin/video-generator/jobs/$jobId", [], $token);
echo "   Current Status: " . ($statusRes['body']['status'] ?? 'Unknown') . "\n";
echo "   Response: " . json_encode($statusRes['body']) . "\n";

echo "--- TEST COMPLETE ---\n";
