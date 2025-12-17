<?php
// Load Laravel
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\PropertyMaster;

$vendors = User::where('role', 'vendor')->get(['id', 'email', 'name']);
echo "Vendors Found: " . $vendors->count() . "\n";
foreach ($vendors as $v) {
    echo "ID: {$v->id} - {$v->name} ({$v->email})\n";
}

$propCount = PropertyMaster::count();
echo "\nTotal Properties: $propCount\n";

$distribution = PropertyMaster::selectRaw('VendorId, count(*) as total')->groupBy('VendorId')->get();
echo "\nCurrent Distribution:\n";
foreach($distribution as $d) {
    echo "VendorId {$d->VendorId}: {$d->total}\n";
}
