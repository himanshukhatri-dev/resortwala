<?php
require dirname(__DIR__) . '/vendor/autoload.php';
$app = require_once dirname(__DIR__) . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

use App\Models\PropertyMaster;
use Illuminate\Support\Facades\DB;

// Search for relevant tables
$ids = [42, 37, 15];
foreach ($ids as $id) {
    $p = PropertyMaster::find($id);
    if ($p) {
        echo "ID: $id | Link: " . ($p->GoogleMapLink ?? 'NULL') . "\n";
    }
}
