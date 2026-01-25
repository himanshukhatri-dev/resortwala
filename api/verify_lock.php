<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->bootstrap();

use App\Services\AvailabilityService;
use App\Models\SystemSetting;
use App\Models\PropertyMaster;
use Carbon\Carbon;

$service = $app->make(AvailabilityService::class);
$propertyId = 48; // Testing Property 48 specifically

echo "--- Property 48 Verification ---\n";
try {
    $prop = PropertyMaster::findOrFail($propertyId);
    echo "Property Name: " . $prop->Name . "\n";
    echo "Type: " . $prop->PropertyType . "\n\n";

    $settings = SystemSetting::current();
    echo "System Locked Until: " . ($settings->system_locked_until ?? 'NOT SET') . "\n";
    echo "Current Time: " . now()->toDateTimeString() . "\n\n";

    $tests = [
        '2026-01-26' => "Before Lock (Expect BLOCKED)",
        '2026-01-27' => "Lock Expiry Day (Expect AVAILABLE)",
        '2026-02-10' => "Future Date (Expect AVAILABLE)"
    ];

    foreach ($tests as $date => $desc) {
        $nextDay = Carbon::parse($date)->addDay()->toDateString();
        echo "Testing $date ($desc):\n";

        $isAvailable = $service->isAvailable($propertyId, $date, $nextDay, 2);
        echo "  isAvailable: " . ($isAvailable ? "YES" : "NO (BLOCKED)") . "\n";

        if (!$isAvailable) {
            echo "  [OK] Blocked as expected for locked period.\n";
        } else {
            echo "  [OK] Available as expected for open period.\n";
        }
        echo "\n";
    }

} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
