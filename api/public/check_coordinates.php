<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

use App\Models\PropertyMaster;
use Illuminate\Support\Facades\DB;

// Fetch a few properties to check their coordinates
$properties = PropertyMaster::select('PropertyId', 'Name', 'Location', 'Latitude', 'Longitude', 'CityLatitude', 'CityLongitude')
    ->limit(5)
    ->get();

echo "Property ID | Name | Latitude | Longitude | CityLat | CityLon\n";
echo "-------------------------------------------------------------\n";
foreach ($properties as $p) {
    echo "{$p->PropertyId} | {$p->Name} | " . 
         ($p->Latitude ?? 'NULL') . " | " . 
         ($p->Longitude ?? 'NULL') . " | " . 
         ($p->CityLatitude ?? 'NULL') . " | " . 
         ($p->CityLongitude ?? 'NULL') . "\n";
}
