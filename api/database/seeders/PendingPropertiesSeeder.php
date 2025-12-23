<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;
use App\Models\User;

class PendingPropertiesSeeder extends Seeder
{
    public function run()
    {
        $faker = Faker::create();
        
        // Ensure we have vendors
        $vendorIds = User::where('role', 'vendor')->pluck('id')->toArray();
        if (empty($vendorIds)) {
            $vendorId = DB::table('users')->insertGetId([
                'name' => 'Auto Vendor',
                'email' => 'autovendor@resortwala.com',
                'password' => bcrypt('password'),
                'role' => 'vendor',
                'created_at' => now(),
                'updated_at' => now()
            ]);
            $vendorIds = [$vendorId];
        }

        $propertyTypes = ['Villa', 'Resort', 'Farmhouse'];
        $locations = ['Lonavala', 'Mahabaleshwar', 'Igatpuri'];
        
        $properties = [];

        for ($i = 1; $i <= 10; $i++) {
            $location = $faker->randomElement($locations);
            $type = $faker->randomElement($propertyTypes);
            $name = "[Pending] " . $type . " " . $faker->words(3, true); 
            
            $properties[] = [
                'VendorId' => $faker->randomElement($vendorIds),
                'Name' => $name,
                'ShortName' => substr($name, 0, 15),
                'Description' => $faker->realText(200),
                'LongDescription' => $faker->realText(500),
                'Location' => $location,
                'CityName' => $location,
                'Address' => $faker->address,
                'PropertyType' => $type, // New column in recent updates? Or implicit?
                'Status' => 'pending',   // Critical for pending list
                'is_approved' => 0,      // Critical for admin approval
                'PricePerNight' => $faker->numberBetween(5000, 15000),
                'price_mon_thu' => $faker->numberBetween(4000, 8000),
                'price_fri_sun' => $faker->numberBetween(8000, 15000),
                'price_sat' => $faker->numberBetween(10000, 18000),
                'MaxCapacity' => 10,
                'NoofRooms' => 3,
                'Occupancy' => 6,
                'onboarding_data' => json_encode([
                    'amenities' => ['WiFi', 'Pool', 'AC'],
                    'pricing' => [
                        'weekday' => 5000,
                        'weekend' => 8000,
                        'saturday' => 10000
                    ],
                    'roomConfig' => [
                        'bedrooms' => [
                            ['id'=>1, 'bedType'=>'Queen'],
                            ['id'=>2, 'bedType'=>'King'],
                            ['id'=>3, 'bedType'=>'Queen']
                        ]
                    ]
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        DB::table('property_masters')->insert($properties);
        echo "Seeded 10 Pending Properties.\n";
    }
}
