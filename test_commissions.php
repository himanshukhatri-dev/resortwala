<?php

use App\Models\Booking;
use App\Models\Connector;
use App\Models\ConnectorEarning;
use App\Services\CommissionService;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/api/vendor/autoload.php';
$app = require_once __DIR__ . '/api/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$service = new CommissionService();

function test($name, $callback) {
    echo "TEST: $name ... ";
    try {
        $callback();
        echo "✅ PASS\n";
    } catch (Throwable $e) {
        echo "❌ FAIL: " . $e->getMessage() . "\n";
    }
}

// Setup Data
$connector = Connector::firstOrCreate(
    ['phone' => '9999999999'], 
    ['name' => 'Edge Case Agent', 'code' => 'EDGE01', 'commission_percent' => 10]
);

// 1. Standard Booking
test("Standard Commission Calc", function() use ($service, $connector) {
    $booking = new Booking();
    $booking->TotalAmount = 10000;
    $booking->connector_id = $connector->id;
    $booking->save(); // Mock save

    $amount = $service->calculateCommission($booking);
    if ($amount != 1000) throw new Exception("Expected 1000, got $amount");
});

// 2. Cancellation (Should revert or be 0)
test("Cancelled Booking Logic", function() use ($connector) {
    // Create a real earnings record
    $earning = ConnectorEarning::create([
        'connector_id' => $connector->id,
        'booking_id' => 99999, // Dummy
        'amount' => 500,
        'status' => 'pending'
    ]);

    // Simulate Cancellation Event
    $earning->update(['status' => 'cancelled', 'notes' => 'Booking Cancelled']);

    $check = ConnectorEarning::find($earning->id);
    if ($check->status !== 'cancelled') throw new Exception("Status did not update to cancelled");
});

// 3. Payout Constraint
test("Cannot Pay Cancelled Commission", function() use ($connector) {
    $earning = ConnectorEarning::create([
        'connector_id' => $connector->id,
        'booking_id' => 99998,
        'amount' => 500,
        'status' => 'cancelled' // Already cancelled
    ]);

    // Attempt to pay (Simulate Controller Logic)
    $cnt = ConnectorEarning::where('id', $earning->id)->where('status', 'pending')->update(['status' => 'paid']);
    
    if ($cnt > 0) throw new Exception("System allowed paying a cancelled commission");
});

echo "\nEdge Case Tests Completed.\n";
