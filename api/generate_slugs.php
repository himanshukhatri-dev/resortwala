<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\PropertyMaster;

$properties = PropertyMaster::all();
echo "Found " . $properties->count() . " properties.\n";

foreach ($properties as $p) {
    if (empty($p->slug)) {
        $p->slug = $p->generateUniqueSlug();
        $p->save();
        echo "Generated slug for ID {$p->PropertyId}: {$p->slug}\n";
    } else {
        echo "Property ID {$p->PropertyId} already has slug: {$p->slug}\n";
    }
}
echo "Done.\n";
