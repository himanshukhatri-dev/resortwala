<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- DLT Audit ---\n";

$dlt = App\Models\DltRegistry::where('template_id', '1707176886664943347')->first();

if (!$dlt) die("DLT Registry '1707176886664943347' NOT FOUND\n");

echo "DLT Content:\n'" . $dlt->approved_content . "'\n";
exit;

// Emulate Logic
$normalized = preg_replace('/\{\{[^}]+\}\}/', '{#var#}', $template->content);
echo "Normalized:\n'" . $normalized . "'\n";

$search = substr($normalized, 0, 15);
echo "Search Prefix (15): '$search'\n";

// Check DB Match
$found = App\Models\DltRegistry::where('approved_content', 'LIKE', $search . '%')->first();

if ($found) {
    echo "MATCH FOUND in DB! ID: " . $found->template_id ."\n";
} else {
    echo "NO MATCH in DB for prefix.\n";
    // Check char by char
    echo "Char Compare (Normalized vs DLT):\n";
    $len = min(strlen($normalized), strlen($dlt->approved_content));
    for ($i = 0; $i < 20; $i++) {
        $c1 = $normalized[$i] ?? 'EOF';
        $c2 = $dlt->approved_content[$i] ?? 'EOF';
        echo "[$i] '$c1' vs '$c2' " . ($c1 === $c2 ? "OK" : "DIFF") . "\n";
    }
}
