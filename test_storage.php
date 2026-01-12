<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Storage;

echo "Current User: " . exec('whoami') . "\n";
echo "Storage Path: " . storage_path('app') . "\n";

try {
    $path = 'bulk_uploads/test/test.txt';
    $result = Storage::disk('local')->put($path, 'Content');
    echo "Storage::put result: " . ($result ? 'TRUE' : 'FALSE') . "\n";
    echo "File Exists Check: " . (file_exists(storage_path('app/'.$path)) ? 'YES' : 'NO') . "\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
