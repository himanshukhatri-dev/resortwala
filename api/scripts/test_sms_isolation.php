<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Http;

function testSms($mobile)
{
    echo "Testing SMS to: $mobile\n";
    $apiKey = '9cc0525b-b5a8-48e2-b3b0-d2ad57b808d5';
    $username = 'Resortwala';
    $senderId = 'ResWla';
    $dltEntityId = '1701176830756233450';
    $dltTemplateId = '1707173874987002446'; // Sample confirmation template id if known, or just a valid one

    $content = "Congrats! Your stay is confirmed. - ResortWala";

    $response = Http::get('http://sms.alldigitalgrowth.in/v2/sendSMS', [
        'username' => $username,
        'message' => $content,
        'sendername' => $senderId,
        'smstype' => 'TRANS',
        'numbers' => $mobile,
        'apikey' => $apiKey,
        'templateid' => $dltTemplateId,
        'peid' => $dltEntityId
    ]);

    echo "Response Status: " . $response->status() . "\n";
    echo "Response Body: " . $response->body() . "\n";
}

$testNumbers = [
    '9870646548',
    '919870646548'
];

foreach ($testNumbers as $n) {
    testSms($n);
    sleep(1);
}
