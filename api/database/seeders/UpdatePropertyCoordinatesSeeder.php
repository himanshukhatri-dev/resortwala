<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class UpdatePropertyCoordinatesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Lonavala Coordinates: 18.7557° N, 73.4091° E
        // Update all properties with 'Lonavala' in location or city
        DB::table('property_masters')
            ->where('Location', 'like', '%Lonavala%')
            ->orWhere('CityName', 'like', '%Lonavala%')
            ->update([
                'Latitude' => 18.7557,
                'Longitude' => 73.4091,
                'CityLatitude' => 18.7557,
                'CityLongitude' => 73.4091
            ]);

        // Karjat Coordinates: 18.9102° N, 73.3283° E
         DB::table('property_masters')
            ->where('Location', 'like', '%Karjat%')
            ->orWhere('CityName', 'like', '%Karjat%')
            ->update([
                'Latitude' => 18.9102,
                'Longitude' => 73.3283,
                'CityLatitude' => 18.9102,
                'CityLongitude' => 73.3283
            ]);

         // Alibaug Coordinates: 18.6414° N, 72.8722° E
         DB::table('property_masters')
            ->where('Location', 'like', '%Alibaug%')
            ->orWhere('CityName', 'like', '%Alibaug%')
            ->update([
                'Latitude' => 18.6414,
                'Longitude' => 72.8722,
                'CityLatitude' => 18.6414,
                'CityLongitude' => 72.8722
            ]);
            
        // Specifically for Property 37 if it exists, ensure it has coords (Assume Lonavala/Mumbai)
        DB::table('property_masters')
            ->where('PropertyId', 37)
            ->update([
                'Latitude' => 18.7500, // Slightly different
                'Longitude' => 73.4100
            ]);
    }
}
