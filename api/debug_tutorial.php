<?php
// Load Laravel
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

// Debug Logic
try {
    echo "Checking Tutorial Model...\n";
    if (!class_exists(\App\Models\Tutorial::class)) {
        echo "ERROR: App\Models\Tutorial class not found.\n";
    } else {
        echo "Class exists.\n";
    }

    echo "Checking database connection...\n";
    \Illuminate\Support\Facades\DB::connection()->getPdo();
    echo "Database connected.\n";

    echo "Checking 'tutorials' table...\n";
    if (\Illuminate\Support\Facades\Schema::hasTable('tutorials')) {
        echo "Table 'tutorials' EXISTS.\n";
        
        $count = \App\Models\Tutorial::count();
        echo "Count: $count\n";

        $test = \App\Models\Tutorial::first();
        if ($test) {
            echo "First Item: " . json_encode($test) . "\n";
        }

    } else {
        echo "ERROR: Table 'tutorials' DOES NOT EXIST.\n";
    }

} catch (\Exception $e) {
    echo "EXCEPTION: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}
