<?php

use App\Models\User;
use Spatie\Permission\Models\Role;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$email = 'himanshu@resortwala.com';
$user = User::where('email', $email)->first();

if (!$user) {
    echo "User {$email} not found.\n";
    exit(1);
}

if (!Role::where('name', 'Developer')->exists()) {
    echo "Role 'Developer' does not exist.\n";
    exit(1);
}

$user->assignRole('Developer');
echo "Successfully assigned 'Developer' role to {$user->name} ({$email}).\n";
echo "Current Roles: " . implode(', ', $user->getRoleNames()->toArray()) . "\n";
