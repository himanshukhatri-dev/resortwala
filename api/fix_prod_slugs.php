<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\PropertyMaster;
use Illuminate\Support\Str;

echo "Populating Property Slugs...\n";
$properties = PropertyMaster::whereNull('slug')->get();
echo "Found " . $properties->count() . " properties.\n";

foreach ($properties as $p) {
    if (!$p->slug) {
        $s = Str::slug($p->Name);
        if (PropertyMaster::where('slug', $s)->where('PropertyId', '!=', $p->PropertyId)->exists()) {
            $s .= '-' . $p->PropertyId;
        }
        $p->slug = $s;
        $p->save();
        echo "Updated: {$p->Name} -> {$s}\n";
    }
}
echo "\nDone!\n";
