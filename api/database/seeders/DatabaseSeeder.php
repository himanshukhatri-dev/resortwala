<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        // 1. Create Admin User
        $admin = User::firstOrCreate(
            ['email' => 'admin@resortwala.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'),
                'role' => 'admin', // Assuming 'role' column or similar logic exists
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        // 2. Create Vendor User
        $vendor = User::firstOrCreate(
            ['email' => 'vendor@resortwala.com'],
            [
                'name' => 'Partner Vendor',
                'password' => Hash::make('password'),
                'role' => 'vendor',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        // 3. Seed Properties & Detailed Data
        $this->call([
            NotificationTemplateSeeder::class,
            DltRegistrySeeder::class,
            // UserSeeder::class,       // Create mass users first
            // VendorDataSeeder::class, // Keep existing specific demo data
            // PropertySeeder::class,   // Create 50+ random properties
            // BookingSeeder::class,    // Create bookings
            // HolidaySeeder::class,
        ]);
    }
}
