<?php

use App\Models\PropertyMaster;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$kernel->bootstrap();

$property = PropertyMaster::find(232);

if ($property) {
    echo "ID: " . $property->PropertyId . "\n";
    echo "Wrapper: \n";
    // Check specific columns
    $cols = ['Price', 'DealPrice', 'ResortWalaRate', 'PerCost', 'admin_pricing', 'onboarding_data'];
    foreach ($cols as $col) {
        $val = $property->$col;
        if (is_array($val) || is_object($val)) {
            echo "$col: " . json_encode($val) . "\n";
        } else {
            echo "$col: " . $val . "\n";
        }
    }
} else {
    echo "Property 232 not found.\n";
}
