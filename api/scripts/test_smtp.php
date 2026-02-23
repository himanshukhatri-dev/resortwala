<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

$email = 'himanshukhatri.1988@gmail.com';

echo "Testing SMTP Connection...\n";
echo "Host: " . config('mail.mailers.smtp.host') . "\n";
echo "Port: " . config('mail.mailers.smtp.port') . "\n";
echo "Encryption: " . config('mail.mailers.smtp.encryption') . "\n";

try {
    Mail::raw('SMTP Test Message - ' . now(), function ($message) use ($email) {
        $message->to($email)
            ->subject('SMTP Isolation Test');
    });
    echo "SUCCESS: Email sent successfully!\n";
} catch (\Exception $e) {
    echo "FAILURE: " . $e->getMessage() . "\n";
    Log::error("SMTP Test Failed: " . $e->getMessage());
}
