<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\UserDeviceToken;
use App\Models\User;

$user = User::where('email', 'admin@resortwala.com')->first();
if (!$user) {
    echo "Admin User not found\n";
    exit(1);
}

// Create or Update Token
$token = UserDeviceToken::updateOrCreate(
    ['device_token' => 'test_token_force_debug_999'],
    [
        'user_id' => $user->id,
        'platform' => 'web',
        'last_seen_at' => now()
    ]
);

echo "Token Force Registered: " . $token->id . "\n";
echo "Device Token: " . $token->device_token . "\n";
