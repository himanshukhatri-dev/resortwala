<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- NOTIFICATION LOGS ---\n";
try {
    $logs = \App\Models\NotificationLog::orderBy('created_at', 'desc')->take(3)->get();
    foreach($logs as $log) {
        echo "ID: {$log->id} | Aud: {$log->audience_type} | Success: {$log->success_count} | Fail: {$log->failure_count} | Time: {$log->created_at}\n";
    }
} catch (\Exception $e) { echo "Error reading logs: " . $e->getMessage() . "\n"; }

echo "\n--- CRAWL JOBS ---\n";
try {
    $jobs = \App\Models\CrawlJob::orderBy('created_at', 'desc')->take(3)->get();
    foreach($jobs as $job) {
        echo "ID: {$job->id} | City: {$job->city} | Status: {$job->status} | Err: " . substr($job->error_message ?? 'NONE', 0, 100) . " | Time: {$job->created_at}\n";
    }
} catch (\Exception $e) { echo "Error reading jobs: " . $e->getMessage() . "\n"; }
