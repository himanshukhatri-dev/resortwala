<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $email = 'mobiletest@test.com';
    $password = 'password';
    
    // Delete if exists to ensure clean state
    \App\Models\User::where('email', $email)->delete();

    $user = \App\Models\User::create([
        'name' => 'Mobile Test Vendor',
        'email' => $email,
        'password' => \Illuminate\Support\Facades\Hash::make($password),
        'business_name' => 'Mobile Resort',
        'phone' => '1234567890',
        'role' => 'vendor',
        'vendor_type' => 'Resort',
        'is_approved' => true
    ]);

    echo "SUCCESS: Created Vendor\n";
    echo "EMAIL: " . $user->email . "\n";
    echo "ID: " . $user->id . "\n";

} catch (\Exception $e) {
    echo "Error: " . $e->getMessage();
}
