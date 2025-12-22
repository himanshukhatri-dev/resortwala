<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $img = App\Models\PropertyImage::latest()->first();
    if ($img) {
        echo "LatestImage PropertyID: " . $img->property_id . " | DB_Path: " . $img->image_path . "\n";
    } else {
        echo "No images found.\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
