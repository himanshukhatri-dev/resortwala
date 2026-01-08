<?php

return [
    'merchant_id' => env('PHONEPE_MERCHANT_ID', 'PGTESTPAYUAT86'),
    'salt_key' => env('PHONEPE_SALT_KEY', '96434309-7796-489d-8924-ab56988a6076'),
    'salt_index' => env('PHONEPE_SALT_INDEX', '1'),
    'env' => env('PHONEPE_ENV', 'UAT'), // UAT or PROD
];
