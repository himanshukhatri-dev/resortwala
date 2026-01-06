<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

$user = User::where('email', 'admin@resortwala.com')->first();
if ($user) {
    $user->password = Hash::make('ResortWala@2024');
    $user->save();
    echo "PASSWORD_RESET_SUCCESS\n";
} else {
    echo "USER_NOT_FOUND\n";
}
