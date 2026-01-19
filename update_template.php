<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\NotificationTemplate;

$content = file_get_contents('rich_booking_confirmed.html');

$tpl = NotificationTemplate::where('name', 'email_booking_confirmed_customer')->first();
if ($tpl) {
    $tpl->content = $content;
    $tpl->save();
    echo "Updated email_booking_confirmed_customer template.\n";
} else {
    echo "Template not found.\n";
}
