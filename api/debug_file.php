<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->bootstrap();

$path = 'properties/52/4rPAqWSfDdjzMllwpXaB4kGA2ZqDEVns5NEua89P.jpeg';
$fullPath = storage_path('app/public/' . $path);
$publicLink = public_path('storage/' . $path);

echo "Checking file: $path\n";
echo "Storage Path: $fullPath\n";
echo "Exists in Storage? " . (file_exists($fullPath) ? "YES" : "NO") . "\n";
if (file_exists($fullPath)) {
    echo "Permissions: " . substr(sprintf('%o', fileperms($fullPath)), -4) . "\n";
    echo "Owner: " . posix_getpwuid(fileowner($fullPath))['name'] . "\n";
}

echo "\nPublic Link Path: $publicLink\n";
echo "Exists via Link? " . (file_exists($publicLink) ? "YES" : "NO") . "\n";

echo "\nSymlink Check:\n";
echo "public/storage link exists? " . (is_link(public_path('storage')) ? "YES" : "NO") . "\n";
if (is_link(public_path('storage'))) {
    echo "Points to: " . readlink(public_path('storage')) . "\n";
}
