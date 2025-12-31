<?php
use App\Models\PropertyMaster;
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$p = PropertyMaster::find(232);
if ($p) {
    echo "GoogleMapLink: " . $p->GoogleMapLink . "\n";
    echo "Location: " . $p->Location . "\n";
    echo "Onboarding Data: " . json_encode($p->onboarding_data) . "\n";
} else {
    echo "Not Found";
}
