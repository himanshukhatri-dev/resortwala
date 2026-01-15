<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$email = 'himanshu.k@gmail.com';
$phone = '9870646548';

$user = App\Models\Customer::where('email', $email)->orWhere('phone', $phone)->first();

if ($user) {
    echo json_encode(['id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'phone' => $user->phone]);
} else {
    echo "User not found";
}
