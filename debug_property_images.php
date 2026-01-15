<?php
// debug_property_images.php
require __DIR__ . '/api/vendor/autoload.php';
$app = require __DIR__ . '/api/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$id = 37;
$property = \App\Models\PropertyMaster::with(['images', 'videos', 'vendor'])->find($id);

if (!$property) {
    echo "Property $id not found.\n";
    exit;
}

echo "Property: {$property->Name} (ID: $id)\n";
echo "Storage Location: storage/app/public/properties/$id\n";
echo "DB Location: " . ($property->Location ?? 'N/A') . ", " . ($property->CityName ?? 'N/A') . "\n";
echo "Address: " . ($property->Address ?? 'N/A') . "\n";

echo "\n--- Images in DB ---\n";
$images = $property->images;
echo "Count: " . $images->count() . "\n";
foreach ($images as $img) {
    echo "ID: {$img->id} | Order: {$img->display_order} | Path: {$img->image_path} | URL: {$img->image_url}\n";
}

echo "\n--- Pending Edit Requests ---\n";
$reqs = \App\Models\PropertyEditRequest::where('property_id', $id)->get();
echo "Count: " . $reqs->count() . "\n";
foreach ($reqs as $r) {
    echo "ID: {$r->id} | Status: {$r->status} | Changes: " . json_encode($r->changes_json) . "\n";
}
