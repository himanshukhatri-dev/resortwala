<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$job = \App\Models\CrawlJob::where('status', 'failed')->latest()->first();
if ($job) {
    echo "ERROR_START\n";
    echo $job->error_message;
    echo "\nERROR_END";
} else {
    echo "NO_FAILED_JOBS";
}
