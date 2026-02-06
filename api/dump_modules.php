<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$modules = \App\Models\LearningModule::with('steps')->get();
foreach ($modules as $m) {
    echo "ID: {$m->id}\n";
    echo "Slug: {$m->slug}\n";
    echo "Title: {$m->title}\n";
    echo "Video URL: " . ($m->video_url ?? 'NULL') . "\n";
    echo "Steps Count: " . count($m->steps) . "\n";
    echo "-------------------\n";
}
