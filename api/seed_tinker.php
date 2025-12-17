
// Helper script for Tinker
use App\Models\PropertyMaster;

$properties = PropertyMaster::whereNull('Latitude')->orWhereNull('Longitude')->get();
echo "Found " . $properties->count() . " properties to update.\n";

foreach ($properties as $p) {
    if (!$p) continue;
    // Random coords near Goa (15.29, 74.12)
    $lat = 15.29 + (mt_rand(-50, 50) / 1000); 
    $lng = 74.12 + (mt_rand(-50, 50) / 1000);

    $p->Latitude = $lat;
    $p->Longitude = $lng;
    $p->save();
}

echo "Seeded coordinates successfully.\n";
return "Done";
