<?php
use App\Models\User;
use Illuminate\Support\Facades\Hash;

$user = User::where('email', 'admin@resortwala.com')->first();
if (!$user) {
    User::create([
        'name' => 'Admin User',
        'email' => 'admin@resortwala.com',
        'password' => Hash::make('admin123'),
        'role' => 'admin',
        'is_approved' => true
    ]);
    echo "Admin Created\n";
} else {
    echo "Admin Exists\n";
}
