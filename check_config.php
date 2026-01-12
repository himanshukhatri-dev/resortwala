<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Config;

echo "MAIL_HOST_VALUE: '" . Config::get('mail.mailers.smtp.host') . "'\n";
echo "MAIL_PORT_VALUE: '" . Config::get('mail.mailers.smtp.port') . "'\n";
echo "APP_KEY_STATUS: " . (empty(Config::get('app.key')) ? "MISSING" : "PRESENT") . "\n";
