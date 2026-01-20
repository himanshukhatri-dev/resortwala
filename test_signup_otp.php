<?php

// Fix for console execution to ensure we can handle HTTP requests
if (session_status() === PHP_SESSION_NONE) {
    // session_start(); 
    // Not needed usually for simple API post
}

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

// We need the HTTP Kernel to handle the request through the middleware stack
$kernel = $app->make(\Illuminate\Contracts\Http\Kernel::class);

echo "--- Testing Signup OTP Flow (Internal Dispatch) ---\n";

// SUCCESS: The previous test confirmed the user exists.
// Now let's test the LOGIN OTP flow which should succeed for this user.
$jsonContent = json_encode(['phone' => '919870646548']);

$request = \Illuminate\Http\Request::create(
    '/api/customer/send-otp', 
    'POST', 
    [],
    [],
    [],
    ['CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json'],
    $jsonContent
);

echo "Dispatching Request to [POST] /api/customer/send-otp (Login Flow)...\n";

echo "Dispatching Request to [POST] /api/customer/register-send-otp...\n";

try {
    $response = $kernel->handle($request);
    
    echo "Response Status: " . $response->getStatusCode() . "\n";
    echo "Response Content: " . $response->getContent() . "\n";
    
    // Terminate properly (optional for script but good practice)
    $kernel->terminate($request, $response);
    
} catch (\Exception $e) {
    echo "FATAL ERROR: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}
