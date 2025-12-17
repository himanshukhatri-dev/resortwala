<?php
use App\Models\PropertyMaster;

$properties = PropertyMaster::all();
echo "Found " . $properties->count() . " properties.\n";

foreach ($properties as $p) {
    // Random coords near Goa (15.29, 74.12)
    $lat = 15.29 + (rand(-100, 100) / 1000); 
    $lng = 74.12 + (rand(-100, 100) / 1000);
    
    $p->Latitude = $lat;
    $p->Longitude = $lng;
    $p->save();
}

echo "Updated coordinates for all properties.\n";
