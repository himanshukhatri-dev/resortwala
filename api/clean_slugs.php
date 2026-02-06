<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$modules = \App\Models\LearningModule::all();
foreach ($modules as $m) {
    if ($m->slug !== trim($m->slug)) {
        echo "Updating slug for ID {$m->id}: '{$m->slug}' -> '" . trim($m->slug) . "'\n";
        $m->slug = trim($m->slug);
        $m->save();
    }
}
echo "Done.\n";
