<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PropertyMaster;

class CoordinatesSeeder extends Seeder
{
    public function run()
    {
        // Fetch properties with missing coordinates
        $properties = PropertyMaster::whereNull('Latitude')->orWhereNull('Longitude')->get();
        
        if ($properties->isEmpty()) {
            $properties = PropertyMaster::all(); // Fallback to update all if none are NULL (just to be safe/force update if requested)
        }

        echo "Seeding coordinates for " . $properties->count() . " properties...\n";

        foreach ($properties as $p) {
            // Random coords near Goa (15.29, 74.12) to ensure they show up on default map center
            $lat = 15.29 + (mt_rand(-50, 50) / 1000); 
            $lng = 74.12 + (mt_rand(-50, 50) / 1000);

            $p->Latitude = $lat;
            $p->Longitude = $lng;
            $p->save();
        }
        
        echo "Done.\n";
    }
}
