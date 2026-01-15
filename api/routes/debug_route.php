<?php
use Illuminate\Support\Facades\Route;
use App\Models\PropertyMaster;

Route::get('/debug-property-29', function () {
    $p = PropertyMaster::find(29);
    if (!$p) return response()->json(['error' => 'Not Found'], 404);
    
    return response()->json([
        'Price' => $p->Price,
        'ResortWalaRate' => $p->ResortWalaRate,
        'admin_pricing' => $p->admin_pricing,
        'price_mon_thu' => $p->price_mon_thu,
        'price_fri_sun' => $p->price_fri_sun,
        'price_sat' => $p->price_sat,
        'onboarding_data' => $p->onboarding_data,
        'raw_admin_pricing' => $p->getRawOriginal('admin_pricing'),
    ]);
});
