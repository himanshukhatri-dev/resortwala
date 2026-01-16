<?php
require dirname(__DIR__) . '/vendor/autoload.php';
$app = require_once dirname(__DIR__) . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

use App\Models\PropertyMaster;

$p = PropertyMaster::where('Name', 'LIKE', '%Visava%')->first();
if ($p) {
    echo "ID: " . $p->PropertyId . " | Name: " . $p->Name . "\n";
    echo "  Property Type: " . $p->PropertyType . "\n";
    echo "  Price Column: " . $p->Price . "\n";
    
    $ap = $p->admin_pricing;
    echo "  Admin Pricing: " . json_encode($ap) . "\n";

    // Re-simulate logic from controller
    $calculatedPrice = $p->Price;
    $source = "Base Price";
    if (strtolower($p->PropertyType) == 'waterpark' && isset($ap['adult']['discounted'])) {
        $calculatedPrice = $ap['adult']['discounted'];
        $source = "Waterpark Adult Matrix";
    }
    
    echo "  CALCULATED: $calculatedPrice (Source: $source)\n";
}

