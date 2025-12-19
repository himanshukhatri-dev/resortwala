<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Super Admin
        User::firstOrCreate(
            ['email' => 'admin@resortwala.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'email_verified_at' => now(),
            ]
        );

        // 2. Primary Vendor (for manual testing)
        User::firstOrCreate(
            ['email' => 'vendor@resortwala.com'],
            [
                'name' => 'Primary Vendor',
                'password' => Hash::make('password'),
                'role' => 'vendor',
                'email_verified_at' => now(),
            ]
        );

        // 3. Create 10 Extra Vendors
        for ($i = 1; $i <= 10; $i++) {
            User::firstOrCreate(
                ['email' => "vendor{$i}@resortwala.com"],
                [
                    'name' => "Vendor {$i}",
                    'password' => Hash::make('password'),
                    'role' => 'vendor',
                    'email_verified_at' => now(),
                ]
            );
        }

        // 4. Create 20 Customers
        for ($i = 1; $i <= 20; $i++) {
            User::firstOrCreate(
                ['email' => "customer{$i}@resortwala.com"],
                [
                    'name' => "Customer {$i}",
                    'password' => Hash::make('password'),
                    'role' => 'customer',
                    'email_verified_at' => now(),
                ]
            );
        }
    }
}
