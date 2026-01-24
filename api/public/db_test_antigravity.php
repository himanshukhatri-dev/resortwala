<?php
// Force error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>DB Connection Test</h1>";

// 1. Test Raw PDO
try {
    // Manually include bootstrap to look like a Laravel app? No, too complex.
    // Let's rely on Laravel's index.php to load this or putting this in public.

    // Actually, simpler: create a test route in api/routes/api.php since we saw it earlier!
    // But modifying routes is invasive. 

    // Correct Autoloader Path
    require __DIR__ . '/../../vendor/autoload.php';
    $app = require_once __DIR__ . '/../bootstrap/app.php';

    $kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
    $response = $kernel->handle(
        $request = Illuminate\Http\Request::capture()
    );

    // Wait, that runs the whole app. 
    // Let's just try to boot and run a query.

    echo "Bootstrap loaded...<br>";

    $app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

    echo "Kernel bootstrapped...<br>";

    $pdo = \DB::connection()->getPdo();
    echo "PDO Connection: OK<br>";

    echo "<h2>Testing Property 48</h2>";
    $p = \App\Models\PropertyMaster::find(48);

    if ($p) {
        echo "Property Found: " . $p->Name;
    } else {
        echo "Property Not Found";
    }

} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage();
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
}
