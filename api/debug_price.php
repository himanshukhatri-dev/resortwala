<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $p = \App\Models\PropertyMaster::find(29);
    if (!$p) {
        echo json_encode(['error' => 'Property Not Found']);
        exit;
    }

    echo json_encode([
        'Price' => $p->Price,
        'ResortWalaRate' => $p->ResortWalaRate,
        'deal_price' => $p->DealPrice,
        // Check exact key names for admin_pricing
        'admin_pricing' => $p->admin_pricing, 
        // Force re-cast if model casting failed
        'raw_admin_pricing' => $p->getRawOriginal('admin_pricing'),
        'onboarding_data' => $p->onboarding_data,
        'price_mon_thu' => $p->price_mon_thu, 
        'price_fri_sun' => $p->price_fri_sun,
        'price_sat' => $p->price_sat,
        // Check if admin_pricing is actually populated manually
        'decoded_admin_pricing' => is_string($p->admin_pricing) ? json_decode($p->admin_pricing, true) : $p->admin_pricing
    ], JSON_PRETTY_PRINT);
} catch (\Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
