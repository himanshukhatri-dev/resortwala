<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;

$user = User::where('email', 'admin@resortwala.com')->first();
if ($user) {
    echo $user->createToken('debug_script')->plainTextToken;
} else {
    echo "User not found";
    exit(1);
}
