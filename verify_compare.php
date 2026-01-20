<?php
// Check for both localhost and public IP to be sure
$url = 'https://127.0.0.1/api/properties/compare?ids=15,16';
$headers = ['Host: api.resortwala.com'];

echo "Fetching $url...\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response Body:\n" . substr($response, 0, 1000) . "...\n";

$json = json_decode($response, true);
if ($json) {
    echo "Count: " . count($json) . "\n";
    if (count($json) > 0) {
        print_r($json[0]); // Print first property to verify structure
    }
} else {
    echo "Invalid JSON\n";
}
