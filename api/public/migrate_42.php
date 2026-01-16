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
    echo "Updating ID: 42 | Name: " . $p->Name . "\n";
    
    $newPricing = [
        'adult_weekday' => ['current' => 800, 'discounted' => 500, 'final' => 550],
        'adult_weekend' => ['current' => 800, 'discounted' => 500, 'final' => 550],
        'child_weekday' => ['current' => 600, 'discounted' => 350, 'final' => 400],
        'child_weekend' => ['current' => 600, 'discounted' => 350, 'final' => 400],
    ];
    
    $p->admin_pricing = $newPricing;
    $p->save();
    
    echo "SUCCESS: admin_pricing updated.\n";
    echo "NEW admin_pricing: " . json_encode($p->admin_pricing) . "\n";
}
