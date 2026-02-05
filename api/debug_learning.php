<?php

use App\Services\LearningService;
use Illuminate\Support\Facades\Log;

require __DIR__ . '/vendor/autoload.php';

$app = require __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- LEARNING SERVICE DIAGNOSTIC ---\n";

try {
    $service = new LearningService();
    echo "Service instantiated.\n";

    echo "Calling getVideos(1)...\n";
    $data = $service->getVideos(1);

    echo "Success! Found " . count($data) . " modules.\n";
    foreach ($data as $module) {
        echo " - [{$module->id}] {$module->title} ({$module->slug})\n";
    }

} catch (\Exception $e) {
    echo "\n[EXCEPTION] " . get_class($e) . ": " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
