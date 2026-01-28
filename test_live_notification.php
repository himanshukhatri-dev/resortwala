<?php

use App\Services\NotificationEngine;
use Illuminate\Support\Facades\Log;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$engine = app(NotificationEngine::class);

echo "Testing Notification Engine...\n";

// Test Data
$mobile = '9876543210'; // Replace with user's number if available or ask input
// I'll try to find a real user from DB or use a hardcoded one if I can find it.
// For now, I'll use a placeholder and output the command to run with arguments.

// Actually, better to fetch the first admin or specific user.
$user = \App\Models\User::where('email', 'himanshukhatri.1988@gmail.com')->first();
if (!$user) {
    echo "User himanshukhatri.1988@gmail.com not found. Using dummy data.\n";
    $recipient = ['mobile' => '919876543210', 'email' => 'test@example.com'];
} else {
    echo "Found User: {$user->name} ({$user->mobile})\n";
    $recipient = $user;
}

// 1. Test Admin Login Alert (Both SMS + Email)
echo "\n--- Testing 'admin.login' (Should send Email + SMS) ---\n";
$data = [
    'name' => 'Himanshu Test',
    'email' => 'himanshukhatri.1988@gmail.com',
    'ip' => '127.0.0.1',
    'time' => date('d-M H:i A'),
    'user_agent' => 'TestScript/1.0'
];

$success = $engine->dispatch('admin.login', $recipient, $data);

echo $success ? "Dispatch returned TRUE.\n" : "Dispatch returned FALSE.\n";
echo "Check logs for details.\n";
