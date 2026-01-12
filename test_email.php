<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Config;

echo "--- MAIL DEBUG START ---\n";
echo "Host: " . Config::get('mail.mailers.smtp.host') . "\n";
echo "Port: " . Config::get('mail.mailers.smtp.port') . "\n";
echo "Username: " . Config::get('mail.mailers.smtp.username') . "\n";
echo "Encryption: " . Config::get('mail.mailers.smtp.encryption') . "\n";
echo "From: " . Config::get('mail.from.address') . "\n";

try {
    Mail::raw('This is a test email from Production Debugger.', function($msg) {
        $msg->to('himanshukhatri.1988@gmail.com')
            ->subject('ResortWala Prod Test Email');
    });
    echo "✅ Email Sent Successfully!\n";
} catch (\Exception $e) {
    echo "❌ SEND FAILED: " . $e->getMessage() . "\n";
}
echo "--- MAIL DEBUG END ---\n";
