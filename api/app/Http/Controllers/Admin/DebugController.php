<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\PhonePeService;
use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class DebugController extends Controller
{
    protected $phonePeService;

    public function __construct(PhonePeService $phonePeService)
    {
        $this->phonePeService = $phonePeService;
    }

    /**
     * Test PhonePe Connectivity with minimal payload
     */
    public function testPhonePe(Request $request)
    {
        // Require admin permissions via middleware usually, but here we can check if needed

        // Create a dummy booking object for testing
        $dummyBooking = (object) [
            'BookingId' => 'TEST_' . time(),
            'paid_amount' => 1.00, // 1 Rupee test
            'CustomerMobile' => $request->mobile ?? '9999999999',
            'transaction_id' => 'DEBUG_' . time()
        ];

        $callbackUrl = route('payment.callback');

        Log::info("Admin Debug: Testing PhonePe Connectivity", ['user' => $request->user()->id ?? 'unknown']);

        $result = $this->phonePeService->initiatePayment($dummyBooking, $callbackUrl);

        return response()->json([
            'test_result' => $result['success'] ? 'SUCCESS' : 'FAILED',
            'service_response' => $result
        ]);
    }
}
