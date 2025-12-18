<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\PropertyMaster;
use App\Models\Booking;
use App\Models\PropertyImage;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class VendorDataSeeder extends Seeder
{
    public function run()
    {
        // 1. Create or Update Vendor
        $vendor = User::firstOrCreate(
            ['email' => 'vendor@resortwala.com'],
            [
                'name' => 'John Doe',
                'password' => Hash::make('password'),
                'role' => 'vendor',
                'is_approved' => true
            ]
        );

        // Ensure approved
        $vendor->update(['is_approved' => true]);

        $this->command->info("Vendor created: {$vendor->email}");

        // 2. Create Properties
        $properties = [
            [
                'Name' => 'Ocean View Villa',
                'Location' => 'Goa',
                'Price' => 15000,
                'Description' => 'Beautiful sea facing villa with private pool.',
                'Image' => 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&auto=format&fit=crop'
            ],
            [
                'Name' => 'Mountain Retreat',
                'Location' => 'Manali',
                'Price' => 12000,
                'Description' => 'Cozy wooden cottage in the hills.',
                'Image' => 'https://images.unsplash.com/photo-1542718610-a1d656d7dd50?w=800&auto=format&fit=crop'
            ],
            [
                'Name' => 'Lakeside Resort',
                'Location' => 'Udaipur',
                'Price' => 25000,
                'Description' => 'Luxury resort on the banks of Lake Pichola.',
                'Image' => 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop'
            ]
        ];

        foreach ($properties as $prop) {
            $property = PropertyMaster::firstOrCreate(
                ['Name' => $prop['Name'], 'vendor_id' => $vendor->id],
                [
                    'ShortName' => substr($prop['Name'], 0, 10),
                    'Location' => $prop['Location'],
                    'CityName' => $prop['Location'],
                    'Price' => $prop['Price'],
                    'Address' => $prop['Location'] . ', India',
                    'LongDescription' => $prop['Description'],
                    'IsActive' => 1,
                    'is_approved' => 1,
                    'PropertyType' => 'Villa',
                    'MaxCapacity' => 10,
                    'NoofRooms' => 4,
                    'share_token' => \Illuminate\Support\Str::uuid()
                ]
            );

            // Add Image if not exists
            if ($property->images()->count() == 0) {
                PropertyImage::create([
                    'property_id' => $property->PropertyId,
                    'image_path' => $prop['Image'],
                    'is_primary' => true
                ]);
            }

            // 3. Create Bookings
            // Create 3 bookings per property
            for ($i = 0; $i < 3; $i++) {
                 Booking::create([
                    'PropertyId' => $property->PropertyId,
                    'CustomerName' => 'Alice ' . chr(65 + $i),
                    'CustomerMobile' => '987654321' . $i,
                    'CheckInDate' => Carbon::today()->addDays($i * 5),
                    'CheckOutDate' => Carbon::today()->addDays($i * 5 + 3),
                    'Guests' => rand(2, 6),
                    'TotalAmount' => $prop['Price'] * 3,
                    'Status' => $i == 0 ? 'confirmed' : ($i == 1 ? 'pending' : 'cancelled')
                 ]);
            }
        }

        $this->command->info('Properties and bookings seeded for vendor.');
    }
}
