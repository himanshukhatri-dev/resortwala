<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $p = \App\Models\PropertyMaster::find(29);
    $output = [];
    if (!$p) {
        $output = ['error' => 'Property Not Found'];
    } else {
        $output = [
            'Price' => $p->Price,
            'ResortWalaRate' => $p->ResortWalaRate,
            'deal_price' => $p->DealPrice,
            'admin_pricing' => $p->admin_pricing, 
            'raw_admin_pricing' => $p->getRawOriginal('admin_pricing'),
            'onboarding_data' => $p->onboarding_data,
            'price_mon_thu' => $p->price_mon_thu, 
            'price_fri_sun' => $p->price_fri_sun,
            'price_sat' => $p->price_sat
        ];
    }
    file_put_contents(__DIR__ . '/price_debug_log.json', json_encode($output, JSON_PRETTY_PRINT));
    echo "Done";
} catch (\Exception $e) {
    file_put_contents(__DIR__ . '/price_debug_log.json', json_encode(['error' => $e->getMessage()]));
}
