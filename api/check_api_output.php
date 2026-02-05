<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$vendorId = 1; // Arbitrary
$service = new \App\Services\LearningService();
$videos = $service->getVideos($vendorId);

header('Content-Type: application/json');
echo json_encode(['status' => 'success', 'data' => $videos], JSON_PRETTY_PRINT);
