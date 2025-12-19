<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserAccountsSeeder extends Seeder
{
    public function run()
    {
        // 1. Customer
        User::updateOrCreate(
            ['email' => 'customer@resortwala.com'],
            [
                'name' => 'Test Customer',
                'password' => Hash::make('Pass@123'),
                'role' => 'customer',
                'vendor_type' => null, // Not a vendor
                'is_approved' => true
            ]
        );

        // 2. Vendor
        User::updateOrCreate(
            ['email' => 'vendor@resortwala.com'],
            [
                'name' => 'Test Vendor',
                'password' => Hash::make('Pass@123'),
                'role' => 'vendor',
                'vendor_type' => 'Resort', // Valid enum: Resort, WaterPark, Villa
                'phone' => '9876543210',
                'business_name' => 'Vendor Resort',
                'is_approved' => true
            ]
        );

        // 3. Admin
        User::updateOrCreate(
            ['email' => 'admin@resortwala.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('Pass@123'),
                'role' => 'admin',
                'vendor_type' => null,
                'is_approved' => true
            ]
        );
        
        $this->command->info('User accounts seeded successfully!');
    }
}
