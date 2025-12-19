<?php
// api/public/db_check.php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

use App\Models\PropertyMaster;

header('Content-Type: application/json');

$id = $_GET['id'] ?? 3;

try {
    $raw = \DB::table('property_masters')->where('PropertyId', $id)->first();
    $eloquent = PropertyMaster::find($id);

    echo json_encode([
        'requested_id' => $id,
        'raw_db_record' => $raw,
        'eloquent_record' => $eloquent,
        'table_stats' => [
            'total_count' => \DB::table('property_masters')->count(),
            'last_ids' => \DB::table('property_masters')->orderBy('PropertyId', 'desc')->limit(5)->pluck('PropertyId')
        ]
    ], JSON_PRETTY_PRINT);
} catch (\Exception $e) {
    echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
}
