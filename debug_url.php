<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\PropertyImage;

$img = PropertyImage::where('property_id', 209)->latest()->first();
if ($img) {
    echo "Image Path: " . $img->image_path . "\n";
    echo "Generated URL: " . $img->image_url . "\n";
    echo "Config App URL: " . config('app.url') . "\n";
} else {
    echo "No image found for 209.\n";
}
