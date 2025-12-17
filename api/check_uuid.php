<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\PropertyMaster;

$uuid = '449e5e48-9223-4fae-97f7-6d14b261f4b8';
$propByUuid = PropertyMaster::where('share_token', $uuid)->first();

echo "Lookup by UUID ($uuid):\n";
if ($propByUuid) {
    echo "  ID: {$propByUuid->PropertyId}\n";
    echo "  Name: {$propByUuid->Name}\n";
    echo "  VendorID: {$propByUuid->vendor_id}\n";
} else {
    echo "  Not Found\n";
}

$prop2 = PropertyMaster::find(2);
echo "\nLookup by ID (2):\n";
if ($prop2) {
    echo "  ID: {$prop2->PropertyId}\n";
    echo "  Name: {$prop2->Name}\n";
    echo "  UUID: {$prop2->share_token}\n";
}
