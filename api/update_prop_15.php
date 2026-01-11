<?php

use App\Models\PropertyMaster;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$kernel->bootstrap();

$property = PropertyMaster::where('PropertyId', 15)->first();

if (!$property) {
    echo "Property 15 not found.\n";
    exit(1);
}

echo "Current Name: " . $property->Name . "\n";

$adminPricing = $property->admin_pricing;

// Update admin_pricing JSON
if (isset($adminPricing['mon_thu']['villa'])) {
    $adminPricing['mon_thu']['villa']['current'] = 40000;
    $adminPricing['mon_thu']['villa']['final'] = 40000;
}
if (isset($adminPricing['fri_sun']['villa'])) {
    $adminPricing['fri_sun']['villa']['current'] = 40000;
    $adminPricing['fri_sun']['villa']['final'] = 40000;
}
if (isset($adminPricing['sat']['villa'])) {
    $adminPricing['sat']['villa']['current'] = 40000;
    $adminPricing['sat']['villa']['final'] = 40000;
}

$property->admin_pricing = $adminPricing;

// Sync main columns
$property->Price = 40000; // Mon-Thu Vendor Ask
$property->ResortWalaRate = 40000; // Mon-Thu Customer Price
$property->price_mon_thu = 40000; // Final Mon-Thu
$property->price_fri_sun = 40000; // Final Fri-Sun
$property->price_sat = 40000; // Final Sat
$property->DealPrice = 40000;

$property->save();

echo "Update successful for Property 15.\n";
echo "New Price: " . $property->Price . "\n";
echo "New ResortWalaRate: " . $property->ResortWalaRate . "\n";
echo "New admin_pricing: " . json_encode($property->admin_pricing) . "\n";
