<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $count = App\Models\PropertyImage::where('property_id', 209)->count();
    echo "Property 209 has $count images.\n";
    
    if ($count > 0) {
        $imgs = App\Models\PropertyImage::where('property_id', 209)->get();
        foreach ($imgs as $img) {
            echo "ID: " . $img->id . " | Path: " . $img->image_path . "\n";
        }
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
