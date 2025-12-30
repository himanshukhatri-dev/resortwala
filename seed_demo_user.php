<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

$email = 'vendor@resortwala.com';
$user = User::where('email', $email)->first();

if (!$user) {
    echo "Creating Demo User...\n";
    User::create([
        'name' => 'Demo Vendor',
        'email' => $email,
        'password' => Hash::make('password'),
        'role' => 'vendor',
        'phone' => '9876543210',
        'is_verified' => true
    ]);
    echo "User Created.\n";
} else {
    echo "User Already Exists.\n";
}
