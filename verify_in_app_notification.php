<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$userId = 1;
$user = \App\Models\Customer::find($userId);

if (!$user) {
    die("Customer $userId not found.\n");
}

echo "Sending Database Notification to {$user->name}...\n";

// Use the Facade to send
\Illuminate\Support\Facades\Notification::send($user, new \App\Notifications\GeneralNotification(
    "Test Database Alert",
    "This should appear in your In-App notifications list.",
    ['type' => 'manual_test']
));

echo "Notification sent. Checking Database...\n";

$notification = $user->notifications()->latest()->first();

if ($notification) {
    echo "SUCCESS: Found notification!\n";
    echo "Title: " . $notification->data['title'] . "\n";
    echo "Body: " . $notification->data['body'] . "\n";
} else {
    echo "FAILURE: No notification found in DB.\n";
}
