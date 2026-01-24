<?php
// Standalone Cache Clear
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

echo "Attempting to clear caches...\n";
try {
    \Illuminate\Support\Facades\Artisan::call('route:clear');
    echo "Route cache cleared.\n";
    \Illuminate\Support\Facades\Artisan::call('config:clear');
    echo "Config cache cleared.\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
