<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

$cols = ['GoogleMapLink', 'CityLatitude', 'CityLongitude', 'share_token'];
foreach ($cols as $col) {
    try {
        $exists = \Illuminate\Support\Facades\Schema::hasColumn('property_masters', $col);
        echo "$col: " . ($exists ? 'YES' : 'NO') . "\n";
    } catch (\Exception $e) {
        echo "$col Error: " . $e->getMessage() . "\n";
    }
}
