<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$modules = \App\Models\LearningModule::with('steps')->get();
foreach ($modules as $m) {
    echo "ID: {$m->id}\n";
    echo "Slug: '{$m->slug}' (Length: " . strlen($m->slug) . ")\n";
    echo "Steps Count: " . count($m->steps) . "\n";
    echo "-------------------\n";
}
