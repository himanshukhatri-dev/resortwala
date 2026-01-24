<?php
// Run this via: php artisan tinker
// Or visit: api.resortwala.com/check-sdk (if route added)

try {
    $hasSdk = class_exists('\PhonePe\payments\v2\standardCheckout\StandardCheckoutClient');
    echo "SDK Class Found: " . ($hasSdk ? "YES ✅" : "NO ❌") . "\n";

    if ($hasSdk) {
        $builder = new \PhonePe\payments\v2\models\request\builders\StandardCheckoutPayRequestBuilder();
        echo "SDK Builder successfully instantiated. ✅\n";
    }
} catch (\Exception $e) {
    echo "Error checking SDK: " . $e->getMessage() . "\n";
}
