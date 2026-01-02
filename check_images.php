<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Checking PropertyImage records for Property ID 1...\n";
$images = App\Models\PropertyImage::where('property_id', 1)->get();

if ($images->isEmpty()) {
    echo "NO RECORDS FOUND in property_images table for property_id 1.\n";
} else {
    echo "Found " . $images->count() . " records:\n";
    print_r($images->toArray());
}

echo "\nChecking PropertyVideo records for Property ID 1...\n";
$videos = App\Models\PropertyVideo::where('property_id', 1)->get();
if ($videos->isEmpty()) {
    echo "NO RECORDS FOUND in property_videos table for property_id 1.\n";
} else {
     echo "Found " . $videos->count() . " records:\n";
    print_r($videos->toArray());
}
