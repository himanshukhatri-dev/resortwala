<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\PropertyMaster;

echo "Synchronizing Property Slugs with Model Logic...\n";
$properties = PropertyMaster::all();
echo "Processing " . $properties->count() . " properties.\n";

foreach ($properties as $p) {
    $oldSlug = $p->slug;
    $newSlug = $p->generateUniqueSlug();
    $p->slug = $newSlug;
    $p->save();
    echo "Updated: {$p->Name} | [{$oldSlug}] -> [{$newSlug}]\n";
}
echo "\nDone!\n";
