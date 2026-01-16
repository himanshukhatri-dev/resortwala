<?php
require dirname(__DIR__) . '/vendor/autoload.php';
$app = require_once dirname(__DIR__) . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

use App\Models\PropertyMaster;

$p = PropertyMaster::find(42);
if ($p) {
    echo "ID: 42 | Name: " . $p->Name . "\n";
    echo "Type: " . $p->PropertyType . "\n";
    
    $ap = $p->admin_pricing;
    $dayOfWeek = now()->dayOfWeek;
    $days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    $todayName = $days[$dayOfWeek];
    $isWeekend = in_array($todayName, ['friday', 'saturday', 'sunday']);
    $wpKey = $isWeekend ? 'adult_weekend' : 'adult_weekday';
    
    $calculatedPrice = $p->Price;
    $source = "Base Price";

    if (strtolower($p->PropertyType) == 'waterpark') {
        if (isset($ap[$wpKey]['final']) && $ap[$wpKey]['final'] > 0) {
            $calculatedPrice = $ap[$wpKey]['final'];
            $source = "WP Matrix ($wpKey)";
        } elseif (isset($ap['adult_rate']['discounted'])) {
            $calculatedPrice = $ap['adult_rate']['discounted'];
            $source = "WP Adult Rate";
        } elseif (isset($ap['adult']['discounted'])) {
            $calculatedPrice = $ap['adult']['discounted'];
            $source = "WP Adult (Legacy)";
        }
    }
    
    echo "RESULT: $calculatedPrice (Source: $source)\n";
    echo "FULL JSON: " . json_encode($ap) . "\n";
}
