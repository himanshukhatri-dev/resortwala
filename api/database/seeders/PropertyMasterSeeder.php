<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PropertyMasterSeeder extends Seeder
{
    public function run()
    {
        $dummyResorts = [
            ['name' => 'Royal Orchid Resort', 'location' => 'Lonavala', 'type' => 'Villa', 'img' => 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'],
            ['name' => 'Blue Water Paradise', 'location' => 'Alibaug', 'type' => 'Waterpark', 'img' => 'https://images.unsplash.com/photo-1540541338287-417002060f05?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'],
            ['name' => 'Mountain View Villa', 'location' => 'Mahabaleshwar', 'type' => 'Villa', 'img' => 'https://images.unsplash.com/photo-1580587771525-78b9dba3b91d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'],
            ['name' => 'Sunshine Resort & Spa', 'location' => 'Goa', 'type' => 'Resort', 'img' => 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'],
            ['name' => 'Lakeside Retreat', 'location' => 'Pawna Lake', 'type' => 'Villa', 'img' => 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'],
            ['name' => 'Palm Grove Resort', 'location' => 'Kerala', 'type' => 'Resort', 'img' => 'https://images.unsplash.com/photo-1582719508461-905c673771fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'],
            ['name' => 'Snow Peak Cottage', 'location' => 'Manali', 'type' => 'Villa', 'img' => 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'],
            ['name' => 'Desert Sands Hotel', 'location' => 'Jaisalmer', 'type' => 'Resort', 'img' => 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'],
            ['name' => 'Forest Hill Estate', 'location' => 'Coorg', 'type' => 'Villa', 'img' => 'https://images.unsplash.com/photo-1449844908441-8829872d2607?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'],
            ['name' => 'Ocean Breeze Stay', 'location' => 'Pondicherry', 'type' => 'Resort', 'img' => 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'],
            ['name' => 'Sky High Apartments', 'location' => 'Mumbai', 'type' => 'Villa', 'img' => 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'],
            ['name' => 'Riverfront Cabins', 'location' => 'Rishikesh', 'type' => 'Resort', 'img' => 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'],
            ['name' => 'Heritage Haveli', 'location' => 'Udaipur', 'type' => 'Villa', 'img' => 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'],
            ['name' => 'Tropical Island Resort', 'location' => 'Andaman', 'type' => 'Waterpark', 'img' => 'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'],
            ['name' => 'Urban Oasis', 'location' => 'Bangalore', 'type' => 'Villa', 'img' => 'https://images.unsplash.com/photo-1600596542815-22b5c1275efb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'],
            ['name' => 'Hilltop Fort Resort', 'location' => 'Pune', 'type' => 'Resort', 'img' => 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'],
            ['name' => 'Sunset Beach Villa', 'location' => 'Gokarna', 'type' => 'Villa', 'img' => 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'],
            ['name' => 'Mystic Woods Resort', 'location' => 'Wayanad', 'type' => 'Resort', 'img' => 'https://images.unsplash.com/photo-1535827841776-24afc1e255ac?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'],
            ['name' => 'Golden Sand Retreat', 'location' => 'Jodhpur', 'type' => 'Villa', 'img' => 'https://images.unsplash.com/photo-1549294413-26f195200c16?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'],
            ['name' => 'Azure Waterpark Resort', 'location' => 'Lonavala', 'type' => 'Waterpark', 'img' => 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'],
        ];

        // Ensure a vendor/user exists
        $vendor = DB::table('users')->first();
        if (!$vendor) {
           $vendorId = DB::table('users')->insertGetId([
               'name' => 'Demo Vendor',
               'email' => 'vendor@demo.com',
               'password' => bcrypt('password'),
               'created_at' => Carbon::now(),
               'updated_at' => Carbon::now(),
           ]);
        } else {
            $vendorId = $vendor->id;
        }

        foreach ($dummyResorts as $index => $resort) {
            // 1. Insert Master (PascalCase Keys)
            $propertyId = DB::table('property_masters')->insertGetId([
                'vendor_id' => $vendorId, // snake_case (FK)
                'Name' => $resort['name'],
                'Address' => $resort['location'] . ', Maharashtra, India',
                'Location' => $resort['location'],
                'CityName' => $resort['location'],
                'LongDescription' => 'Experience luxury and comfort at our premium property. Perfect for family vacations and weekend getaways.',
                'PropertyType' => $resort['type'],
                'Price' => rand(3000, 15000),
                'DealPrice' => rand(2500, 14000),
                'MaxCapacity' => rand(10, 50),
                'NoofRooms' => rand(5, 20),
                'IsActive' => true,
                'PropertyStatus' => true,
                'IsVendorPropAvailable' => true,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
                'CreatedOn' => Carbon::now(),
                'UpdatedOn' => Carbon::now(),
            ]);

            // 2. Insert Image (One Primary)
            DB::table('property_images')->insert([
                'property_id' => $propertyId,
                'image_path' => $resort['img'],
                'is_primary' => true,
                'display_order' => 1,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
        }
    }
}
