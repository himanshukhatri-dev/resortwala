<?php

use Illuminate\Support\Facades\Http;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- Debugging SMS API Variants ---\n";

$apiKey = config('services.sms.api_key') ?? env('SMS_API_KEY');
$username = config('services.sms.username') ?? 'Resortwala';
$senderId = 'ResWla';
$mobile = '919870646548'; 
$message = "Security Alert: New login to your ResortWala Admin account from 127.0.0.1 at 20-Jan 10:11 AM. - ResortWala";
$templateId = '1707176886673745125';
$entityId = '1701176830756233450';

$variants = [
    'Original (dltentityid)' => [
        'templateid' => $templateId,
        'dltentityid' => $entityId
    ],
    'Variant A (EntityId / TemplateId)' => [
        'TemplateId' => $templateId,
        'EntityId' => $entityId
    ],
    'Variant B (PE_ID / Template_ID)' => [
        'Template_ID' => $templateId,
        'PE_ID' => $entityId
    ],
    'Variant C (dlt_entity_id / dlt_template_id)' => [
        'dlt_template_id' => $templateId,
        'dlt_entity_id' => $entityId
    ]
];

foreach ($variants as $name => $extraParams) {
    echo "Testing: $name ... ";
    
    $params = array_merge([
        'username' => $username,
        'message' => $message,
        'sendername' => $senderId,
        'smstype' => 'TRANS',
        'numbers' => $mobile,
        'apikey' => $apiKey,
    ], $extraParams);

    $response = Http::get('http://sms.alldigitalgrowth.in/sendSMS', $params);
    
    echo "Status: " . $response->status() . " | Body: " . substr($response->body(), 0, 100) . "\n";
    
    if ($response->successful() && !str_contains($response->body(), 'Error')) {
        echo ">>> SUCCESS FOUND with $name! <<<\n";
        break;
    }
}
