<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$videos = DB::table('learning_videos')->get();

echo "Total Videos: " . $videos->count() . "\n";

foreach ($videos as $video) {
    echo "ID: {$video->id} | Title: {$video->title} | Category: {$video->category} | Active: {$video->is_active}\n";
}

$walkthroughs = DB::table('page_walkthroughs')->get();
echo "\nTotal Walkthroughs: " . $walkthroughs->count() . "\n";

$help = DB::table('contextual_help_content')->get();
echo "\nTotal Help Items: " . $help->count() . "\n";
