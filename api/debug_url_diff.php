<?php
// debug_url_diff.php

// 1. Failing URL (From Logs)
$failingUrl = "http://sms.alldigitalgrowth.in/sendSMS?username=Resortwala&message=Your+ResortWala+verification+code+is%3A+836948.+Valid+for+10+minutes.&sendername=ResWla&smstype=TRANS&numbers=919870646548&templateid=1007469695624158431&entityid=1001569562865275631";

// 2. Working URL (Re-construct from strict parameters that worked)
$username = 'Resortwala';
$message = "Your ResortWala verification code is: 123456. Valid for 10 minutes.";
$senderId = 'ResWla';
$mobile = '919870646548';
$apiKey = '6df36282-58e1-4c74-9844-3253723707c2'; // Retrieved from env in previous step
$templateId = '1007469695624158431';
$entityId = '1001569562865275631';

$queryParams = [
    'username' => $username,
    'message' => $message,
    'sendername' => $senderId,
    'smstype' => 'TRANS',
    'numbers' => $mobile,
    'apikey' => $apiKey,
    'templateid' => $templateId,
    'entityid' => $entityId,
];
$workingUrl = 'http://sms.alldigitalgrowth.in/sendSMS?' . http_build_query($queryParams);

echo "Failing URL: $failingUrl\n";
echo "Working URL: $workingUrl\n";

// Check for missing API Key in failing URL
if (strpos($failingUrl, 'apikey') === false) {
    echo "CRITICAL: 'apikey' parameter is MISSING in the failing URL!\n";
} else {
    echo "apikey is present.\n";
}
