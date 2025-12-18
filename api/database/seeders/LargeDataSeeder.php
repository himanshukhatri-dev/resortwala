<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\PropertyMaster;
use App\Models\PropertyImage;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class LargeDataSeeder extends Seeder
{
    public function run()
    {
        // 1. Create 5 Customers
        $this->command->info("Creating 5 Customers...");
        for ($i = 1; $i <= 5; $i++) {
            User::firstOrCreate(
                ['email' => "customer{$i}@resortwala.com"],
                [
                    'name' => "Customer {$i}",
                    'password' => Hash::make('password'),
                    'role' => 'customer',
                    'phone' => '987654321' . $i
                ]
            );
        }

        // 2. Create 5 Vendors and their Properties
        $this->command->info("Creating 5 Vendors & 25 Properties...");
        
        $locations = ['Goa', 'Lonavala', 'Manali', 'Shimla', 'Udaipur', 'Jaipur', 'Kerala', 'Rishikesh'];
        $types = ['Villa', 'Resort', 'Hotel', 'Cottage'];
        $imageUrls = [
            'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800', // Resort
            'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800', // Pool
            'https://images.unsplash.com/photo-1571896349842-6e53ce41e887?w=800', // Room
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', // Hotel
            'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800', // Villa
            'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800', // Modern
            'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800', // Traditional
        ];
        
        for ($v = 1; $v <= 5; $v++) {
            $vendor = User::firstOrCreate(
                ['email' => "vendor{$v}@resortwala.com"],
                [
                    'name' => "Vendor {$v} Owner",
                    'password' => Hash::make('password'),
                    'role' => 'vendor',
                    'phone' => '912345678' . $v,
                    'is_approved' => true,
                    'business_name' => "Vendor {$v} Business"
                ]
            );

            // Create 5 Properties for this Vendor
            for ($p = 1; $p <= 5; $p++) {
                $loc = $locations[array_rand($locations)];
                $type = $types[array_rand($types)];
                $name = "$type " . $this->getRandomName();
                
                $price = rand(5000, 25000);
                
                $property = PropertyMaster::create([
                    'vendor_id' => $vendor->id,
                    'Name' => $name,
                    'ShortName' => substr($name, 0, 15),
                    'PropertyType' => $type,
                    'Price' => $price,
                    'price_mon_thu' => $price * 0.8,
                    'price_fri_sun' => $price * 1.2,
                    'price_sat' => $price * 1.5,
                    'Location' => $loc,
                    'CityName' => $loc,
                    'Address' => "$loc, India",
                    'LongDescription' => "Experience luxury at $name in $loc. Features stunning views, modern amenities, and 24/7 service. Perfect for family vacations or romantic getaways.",
                    'IsActive' => 1,
                    'is_approved' => 1,
                    'MaxCapacity' => rand(4, 15),
                    'NoofRooms' => rand(2, 8),
                    'share_token' => Str::uuid()
                ]);

                // Add 3 Images
                $selectedImages = $this->getRandomImages($imageUrls, 3);
                foreach($selectedImages as $key => $url) {
                     PropertyImage::create([
                        'property_id' => $property->PropertyId,
                        'image_path' => $url,
                        'is_primary' => $key === 0
                    ]);
                }
            }
        }
        
        $this->command->info("Done! Created 5 Vendors, 5 Customers, 25 Properties.");
    }

    private function getRandomName()
    {
        $adjectives = ['Royal', 'Grand', 'Hidden', 'Sunny', 'Crystal', 'Golden', 'Silver', 'Blue'];
        $nouns = ['Palace', 'Escape', 'Hideaway', 'Oasis', 'Haven', 'Paradise', 'Retreat', 'Bay'];
        
        return $adjectives[array_rand($adjectives)] . ' ' . $nouns[array_rand($nouns)];
    }

    private function getRandomImages($array, $count)
    {
        $keys = array_rand($array, $count);
        $results = [];
        if (is_array($keys)) {
            foreach ($keys as $key) {
                $results[] = $array[$key];
            }
        } else {
            $results[] = $array[$keys];
        }
        return $results;
    }
}
