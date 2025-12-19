<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;
use App\Models\User;

class PropertySeeder extends Seeder
{
    public function run()
    {
        $faker = Faker::create();
        
        // Ensure we have vendors
        $vendorIds = User::where('role', 'vendor')->pluck('id')->toArray();
        if (empty($vendorIds)) {
            // Fallback if seeded order is wrong
            $vendorId = DB::table('users')->insertGetId([
                'name' => 'Fallback Vendor',
                'email' => 'fallback@vendor.com',
                'password' => bcrypt('password'),
                'role' => 'vendor'
            ]);
            $vendorIds = [$vendorId];
        }

        $propertyTypes = ['Villa', 'Resort', 'Hotel', 'Cottage', 'Farmhouse'];
        $locations = ['Lonavala', 'Goa', 'Mahabaleshwar', 'Alibaug', 'Karjat', 'Igatpuri', 'Mumbai'];
        $amenitiesList = ['WiFi', 'Pool', 'AC', 'Parking', 'TV', 'Kitchen', 'Caretaker', 'BBQ', 'Bonfire', 'Garden'];

        $properties = [];

        // Generate 60 Properties
        for ($i = 1; $i <= 60; $i++) {
            $location = $faker->randomElement($locations);
            $type = $faker->randomElement($propertyTypes);
            $name = "{$type} " . $faker->firstName . " " . $faker->lastName; // e.g., Villa John Doe
            
            // Random amenities (3 to 6 items)
            $selectedAmenities = $faker->randomElements($amenitiesList, rand(3, 6));
            
            echo "Generating Property $i: $name \n";

            $properties[] = [
                'VendorId' => $faker->randomElement($vendorIds),
                'Name' => $name,
                'Description' => $faker->realText(200),
                'Location' => $location,
                'Address' => $faker->address,
                'PricePerNight' => $faker->numberBetween(2000, 25000),
                'MaxGuests' => $faker->numberBetween(2, 20),
                'Bedrooms' => $faker->numberBetween(1, 10),
                'Bathrooms' => $faker->numberBetween(1, 10),
                'Amenities' => json_encode($selectedAmenities),
                'Images' => json_encode([
                    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800',
                    'https://images.unsplash.com/photo-1580587771525-78b9dba3b91d?auto=format&fit=crop&w=800',
                    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800'
                ]), // Using Unsplash generic property images
                'Status' => 'active',
                'is_approved' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        // Insert in chunks to be safe
        echo "Inserting " . count($properties) . " properties...\n";
        foreach (array_chunk($properties, 20) as $chunk) {
            DB::table('property_masters')->insert($chunk);
            echo "Inserted chunk of " . count($chunk) . "\n";
        }
    }
}
