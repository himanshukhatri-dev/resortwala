<?php

use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

// Adjust paths for being in the root of 'api' or 'public'
// Assuming this file is placed in 'api/public/test_mail_send.php' or 'api/test_mail_send.php'

// Try to find autoload
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    require __DIR__ . '/vendor/autoload.php';
    $app = require_once __DIR__ . '/bootstrap/app.php';
} elseif (file_exists(__DIR__ . '/../vendor/autoload.php')) {
    require __DIR__ . '/../vendor/autoload.php';
    $app = require_once __DIR__ . '/../bootstrap/app.php';
} else {
    die("Could not find autoload.php");
}

$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

echo "<h2>ResortWala SMTP Test (Updated)</h2>";

echo "<h3>1. Configuration Check</h3>";
echo "<pre>";
print_r([
    'MAIL_MAILER' => config('mail.default'),
    'MAIL_HOST' => config('mail.mailers.smtp.host'),
    'MAIL_PORT' => config('mail.mailers.smtp.port'),
    'MAIL_USERNAME' => config('mail.mailers.smtp.username') ? 'SET (' . config('mail.mailers.smtp.username') . ')' : 'NOT SET',
    'MAIL_ENCRYPTION' => config('mail.mailers.smtp.encryption'),
    'MAIL_FROM' => config('mail.from.address')
]);
echo "</pre>";

echo "<h3>2. Sending Test Email</h3>";

$toEmail = $_GET['email'] ?? 'resortwala.app@gmail.com'; 

try {
    Mail::raw("This is a test email sent at " . date('Y-m-d H:i:s'), function ($message) use ($toEmail) {
        $message->to($toEmail)
                ->subject('SMTP Verification Test - ' . date('H:i:s'));
    });
    echo "<div style='color: green; font-weight: bold;'>SUCCESS: Email sent to $toEmail!</div>";
} catch (\Exception $e) {
    echo "<div style='color: red; font-weight: bold;'>FAILURE: " . $e->getMessage() . "</div>";
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
}
