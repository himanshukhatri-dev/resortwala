<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\NotificationTemplate;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

echo "\n--- TESTING EMAIL LAYOUT ---\n";

// 1. Get a standard template (e.g., Welcome)
$template = NotificationTemplate::where('name', 'auth.welcome_email')->first();

if (!$template) {
    echo "Error: Template 'auth.welcome_email' not found. Seeding might have failed.\n";
    // Fallback
    $content = "<p>Fallback Content</p>";
} else {
    echo "Found Template: {$template->name}\n";
    $content = str_replace('{{name}}', 'Test User', $template->content);
}

// 2. Render View Manually to check for errors
try {
    $html = view('emails.layout', ['content' => $content])->render();
    echo "Layout Rendered Successfully!\n";

    if (strpos($html, 'resortwala-logo.png') !== false) {
        echo "[PASS] Logo found.\n";
    } else {
        echo "[FAIL] Logo MISSING.\n";
    }

    if (strpos($html, 'Team ResortWala') !== false) {
        echo "[PASS] Footer found.\n";
    } else {
        echo "[FAIL] Footer MISSING.\n";
    }

    // 3. Dispatch Validation
    $engine = new \App\Services\NotificationEngine();
    $engine->sendEmail($template->id ?? 1, 'test@example.com', ['name' => 'Himanshu'], 'manual.test');
    echo "Engine Dispatch Triggered.\n";

} catch (\Exception $e) {
    echo "FATAL ERROR: " . $e->getMessage() . "\n";
}
echo "--------------------------\n";
