<?php
$url = 'https://127.0.0.1/api/ping';
$headers = ['Host: api.resortwala.com'];

echo "Starting floods to $url (Host: api.resortwala.com)...\n";

$success = 0;
$blocked = 0;

for ($i = 0; $i < 70; $i++) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_NOBODY, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
    
    // Simulate same IP (localhost)
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode == 200) $success++;
    if ($httpCode == 429) $blocked++;
    
    echo ".";
    if ($i % 10 == 0) echo " $i ($httpCode)\n";
}

echo "\nSummary:\n";
echo "Success (200): $success\n";
echo "Blocked (429): $blocked\n";
