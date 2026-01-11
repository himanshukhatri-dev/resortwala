<?php

use App\Models\PropertyMaster;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$kernel->bootstrap();

$property = PropertyMaster::where('PropertyId', 15)->first();

if ($property) {
    echo "ID: " . $property->PropertyId . "\n";
    echo "Name: " . $property->Name . "\n";
    $cols = ['Price', 'price_mon_thu', 'price_fri_sun', 'price_sat', 'admin_pricing', 'onboarding_data'];
    foreach ($cols as $col) {
        $val = $property->$col;
        echo "$col: " . (is_array($val) || is_object($val) ? json_encode($val) : $val) . "\n";
    }
} else {
    echo "Property 15 not found.\n";
}
