<?php

require __DIR__ . '/vendor/autoload.php';

echo "--- Debugging URL Encoding ---\n";

$apiKey = '9cc0525b-b5a8-48e2-b3b0-d2ad57b808d5';
$username = 'Resortwala';
$senderId = 'ResWla';
$entityId = '1701176830756233450';
$mobile = '919870646548'; 
$messageRaw = "Dear User, 123456 is your OTP for login at ResortWala. Valid for 10 mins. Do not share. - ResortWala";
$templateId = '1707176886644052410'; 
$route = '6';

// 1. RAW Spaces (Browser often does this or %20)
$msgSpace = $messageRaw; 
$url1 = "http://sms.alldigitalgrowth.in/sendSMS?username=$username&message=" . urlencode($msgSpace) . "&sendername=$senderId&smstype=TRANS&numbers=$mobile&apikey=$apiKey&templateid=$templateId&entityid=$entityId&route=$route";

// Laravel/Guzzle typically uses RFC 3986 (%20) or RFC 1738 (+) depending on build_query type
// Let's try manual curl with %20 distinctively

$msgPercent20 = str_replace(' ', '%20', $messageRaw);
$urlPercent20 = "http://sms.alldigitalgrowth.in/sendSMS?username=$username&message=$msgPercent20&sendername=$senderId&smstype=TRANS&numbers=$mobile&apikey=$apiKey&templateid=$templateId&entityid=$entityId&route=$route";

$msgPlus = str_replace(' ', '+', $messageRaw);
$urlPlus = "http://sms.alldigitalgrowth.in/sendSMS?username=$username&message=$msgPlus&sendername=$senderId&smstype=TRANS&numbers=$mobile&apikey=$apiKey&templateid=$templateId&entityid=$entityId&route=$route";

echo "1. Testing %20 Encoding (Browser style)...\n";
echo "URL: $urlPercent20\n";
$res1 = file_get_contents($urlPercent20);
echo "Result: $res1\n\n";

echo "2. Testing + Encoding (Form style)...\n";
echo "URL: $urlPlus\n";
$res2 = file_get_contents($urlPlus);
echo "Result: $res2\n\n";

// Verify with curl exec to be sure
echo "3. Curl Exec %20...\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $urlPercent20);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$res3 = curl_exec($ch);
echo "Result: $res3\n";
curl_close($ch);
