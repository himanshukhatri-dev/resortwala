<?php

use App\Models\PropertyMaster;
use Illuminate\Support\Facades\DB;

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$properties = PropertyMaster::select('PropertyId', 'Name', 'Location', 'Latitude', 'Longitude')->get();

echo "Property ID | Name | Location | Latitude | Longitude\n";
echo "---------------------------------------------------------\n";

foreach ($properties as $p) {
    echo "{$p->PropertyId} | {$p->Name} | {$p->Location} | " . ($p->Latitude ?? 'NULL') . " | " . ($p->Longitude ?? 'NULL') . "\n";
}
