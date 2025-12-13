<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create default admin account
        // Create or Update default admin account (Force password reset)
        User::updateOrCreate(
            ['email' => 'admin@resortwala.com'],
            [
                'name' => 'Admin',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
                'is_approved' => true // Ensure approved if that column is relevant for generic users
            ]
        );

        $this->command->info('Admin account created: admin@resortwala.com / admin123');
    }
}
